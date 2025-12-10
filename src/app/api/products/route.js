// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";
import { randomBytes } from "crypto";
import path from "path";

// Define max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Cache JSON for 5 minutes (ISR for the route)
export const revalidate = 300;

// -- GET: All products with their variants (Adjusted for many-to-many categories)

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Combine all category IDs into a single array for filtering
  const typeCategoryIdsRaw = searchParams.get("type_category_id") || "";
  const typeCategoryIds = typeCategoryIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const styleCategoryIdsRaw = searchParams.get("style_category_id") || "";
  const styleCategoryIds = styleCategoryIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const colors = searchParams.get("colors")?.split(",");
  const sizes = searchParams.get("sizes")?.split(",");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const offset = (page - 1) * limit;
  const sortBy = searchParams.get("sortBy") || "created_at_desc";
  const query = searchParams.get("query");
  const onSaleOnly = searchParams.get("on_sale") === "true";

  let whereClauses = [];
  const queryParams = [];

  // ---- Search filter ----
  if (query && query.trim()) {
    const searchTerm = query.trim();
    const normalizedSearch = searchTerm.toLowerCase().replace(/[\s-]/g, "");
    whereClauses.push(`(
      p.name LIKE ?
      OR p.description LIKE ?
      OR LOWER(REPLACE(REPLACE(p.name, ' ', ''), '-', '')) LIKE ?
      OR LOWER(REPLACE(REPLACE(p.description, ' ', ''), '-', '')) LIKE ?
    )`);
    const likePattern = `%${searchTerm}%`;
    const normalizedPattern = `%${normalizedSearch}%`;
    queryParams.push(
      likePattern,
      likePattern,
      normalizedPattern,
      normalizedPattern
    );
  }

  // ---- On Sale filter ----
  if (onSaleOnly) {
    whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM sale_product sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE sp.product_id = p.product_id
      AND s.start_date <= NOW() AND s.end_date >= NOW()
    )
  `);
  }

  // ---- Category filtering logic ----
  if (styleCategoryIds.length > 0 && typeCategoryIds.length > 0) {
    const stylePlaceholders = styleCategoryIds.map(() => "?").join(",");
    const typePlaceholders = typeCategoryIds.map(() => "?").join(",");
    whereClauses.push(`
      EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.product_id
          AND pc.category_id IN (${stylePlaceholders})
      )
    `);
    queryParams.push(...styleCategoryIds);
    whereClauses.push(`
      EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.product_id
          AND pc.category_id IN (${typePlaceholders})
      )
    `);
    queryParams.push(...typeCategoryIds);
  } else if (styleCategoryIds.length > 0) {
    const stylePlaceholders = styleCategoryIds.map(() => "?").join(",");
    whereClauses.push(`
      EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.product_id
          AND pc.category_id IN (${stylePlaceholders})
      )
    `);
    queryParams.push(...styleCategoryIds);
  } else if (typeCategoryIds.length > 0) {
    const typePlaceholders = typeCategoryIds.map(() => "?").join(",");
    whereClauses.push(`
      EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.product_id
          AND pc.category_id IN (${typePlaceholders})
      )
    `);
    queryParams.push(...typeCategoryIds);
  }

  // ---- Price filter ----
  if (minPrice && maxPrice) {
    whereClauses.push(
      `(SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) BETWEEN ? AND ?`
    );
    queryParams.push(minPrice, maxPrice);
  }

  // ---- Attribute filters ----
  const addAttributeFilter = (attributeName, values) => {
    if (values && values.length > 0) {
      whereClauses.push(`
        EXISTS (
          SELECT 1 FROM product_variants pv
          JOIN variant_values vv ON pv.variant_id = vv.variant_id
          JOIN attribute_values av ON vv.value_id = av.value_id
          JOIN attributes a ON av.attribute_id = a.attribute_id
          WHERE pv.product_id = p.product_id
            AND a.name = ?
            AND av.value IN (?)
        )
      `);
      queryParams.push(attributeName, values);
    }
  };
  addAttributeFilter("Color", colors);
  addAttributeFilter("Size", sizes);

  // ---- Sorting logic ----
  let orderByClause = "";
  if (query && query.trim()) {
    const searchTerm = query.trim();
    orderByClause = `ORDER BY 
      CASE 
        WHEN LOWER(p.name) = LOWER(?) THEN 0
        WHEN LOWER(p.name) LIKE LOWER(?) THEN 1
        WHEN LOWER(REPLACE(REPLACE(p.name, ' ', ''), '-', '')) LIKE LOWER(?) THEN 2
        ELSE 3
      END`;
  }

  switch (sortBy) {
    case "price_asc":
      orderByClause += orderByClause
        ? ", price ASC"
        : "ORDER BY price IS NULL, price ASC";
      break;
    case "price_desc":
      orderByClause += orderByClause ? ", price DESC" : "ORDER BY price DESC";
      break;
    case "popularity_desc":
      orderByClause += orderByClause ? ", rating DESC" : "ORDER BY rating DESC";
      break;
    case "orders_desc":
      orderByClause += orderByClause
        ? ", total_orders DESC"
        : "ORDER BY total_orders DESC";
      break;
    case "orders_asc":
      orderByClause += orderByClause
        ? ", total_orders ASC"
        : "ORDER BY total_orders ASC";
      break;
    case "created_at_desc":
      orderByClause += orderByClause
        ? ", p.created_at DESC"
        : "ORDER BY p.created_at DESC";
      break;
    default:
      orderByClause += orderByClause
        ? ", p.created_at DESC"
        : "ORDER BY p.created_at DESC";
      break;
  }
  if (!orderByClause.includes("p.created_at DESC")) {
    orderByClause += ", p.created_at DESC";
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // ---- Count query ----
  const countQuery = `SELECT COUNT(DISTINCT p.product_id) as total FROM products p ${whereClause};`;

  // ---- Data query with Sale info (MIN() for sale fields) ----
  const dataQuery = `
        SELECT
        p.product_id, p.name, p.slug, p.description, p.created_at,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.product_id) AS rating,
        (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) AS price,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.product_id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1) AS main_image,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('category_id', c.category_id, 'name', c.name)) FROM product_categories pc JOIN categories c ON pc.category_id = c.category_id WHERE pc.product_id = p.product_id) AS categories,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'variant_id', pv.variant_id,
            'sku', pv.sku,
            'price', pv.price,
            'quantity', pv.quantity,
            'attributes', (
              SELECT JSON_ARRAYAGG(JSON_OBJECT('name', a.name, 'value', av.value))
              FROM variant_values vv
              JOIN attribute_values av ON vv.value_id = av.value_id
              JOIN attributes a ON av.attribute_id = a.attribute_id
              WHERE vv.variant_id = pv.variant_id
            )
          )
        ) FROM product_variants pv WHERE pv.product_id = p.product_id) AS variants,
        (SELECT COALESCE(SUM(pv.quantity), 0) FROM product_variants pv WHERE pv.product_id = p.product_id) AS total_variants_quantities,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN product_variants pv ON oi.variant_id = pv.variant_id
          WHERE pv.product_id = p.product_id
        ), 0) AS total_orders,
        MIN(s.id) AS sale_id,
        MIN(s.name) AS sale_name,
        MIN(s.discount_type) AS discount_type,
        MIN(s.discount_value) AS discount_value
      FROM products p
      LEFT JOIN sale_product sp ON p.product_id = sp.product_id
      LEFT JOIN sales s ON sp.sale_id = s.id AND s.start_date <= NOW() AND s.end_date >= NOW()
      ${whereClause}
      GROUP BY p.product_id
      ${orderByClause}
      LIMIT ? OFFSET ?;
  `;

  // Final query params
  const countQueryParams = [...queryParams];
  const dataQueryParams = [...queryParams];
  if (query && query.trim()) {
    const searchTerm = query.trim();
    const normalizedSearch = searchTerm.toLowerCase().replace(/[\s-]/g, "");
    dataQueryParams.push(searchTerm);
    dataQueryParams.push(`${searchTerm}%`);
    dataQueryParams.push(`%${normalizedSearch}%`);
  }
  dataQueryParams.push(limit, offset);

  try {
    const [[countResult], [products]] = await Promise.all([
      pool.query(countQuery, countQueryParams),
      pool.query(dataQuery, dataQueryParams),
    ]);
    const total = countResult[0].total;

    const productsWithParsedData = products.map((product) => ({
      ...product,
      categories:
        typeof product.categories === "string"
          ? JSON.parse(product.categories)
          : product.categories || [],
      variants:
        typeof product.variants === "string"
          ? JSON.parse(product.variants)
          : product.variants || [],
    }));

    return NextResponse.json({
      products: productsWithParsedData,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
// -- POST: Create new product with variants, categories, and images
export async function POST(req) {
  // Helper: Generate secure filenames
  function generateSecureFilename(originalFilename, mimeType) {
    const randomName = randomBytes(16).toString("hex");
    const extensionMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = extensionMap[mimeType] || "jpg";
    return `${randomName}.${extension}`;
  }

  // Helper: Validate mime type
  function validateImageMimeType(mimeType) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return allowedTypes.includes(mimeType);
  }

  // Helper: Sanitize filename
  function sanitizeFilename(filename) {
    let sanitized = filename.replace(/[\/\\]/g, "").replace(/\0/g, "");
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
    sanitized = sanitized.replace(/^\.+/, "");
    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }
    return sanitized || "unnamed";
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await req.json();
    const { name, description, category_ids, images, variants } = body;

    // Basic validation
    if (
      !name ||
      !description ||
      !Array.isArray(category_ids) ||
      category_ids.length === 0 ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid required fields. Product must have a name, description, and at least one category.",
        },
        { status: 400 }
      );
    }

    // 1) Insert base product
    const [prodRes] = await connection.query(
      `INSERT INTO products (name, description) VALUES (?, ?)`,
      [name, description]
    );
    const product_id = prodRes.insertId;

    // 2) Link product to categories
    const categoryValues = category_ids.map((catId) => [product_id, catId]);
    await connection.query(
      `INSERT INTO product_categories (product_id, category_id) VALUES ?`,
      [categoryValues]
    );

    // 3) Build and save slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${product_id}-${baseSlug}`;
    await connection.query(
      `UPDATE products SET slug = ? WHERE product_id = ?`,
      [slug, product_id]
    );

    // 4) Insert Variants & Attributes
    const createdVariants = []; // Store order to map indices later
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const { price, quantity, attributes } = variant;

      if (
        typeof price !== "number" ||
        typeof quantity !== "number" ||
        !Array.isArray(attributes)
      ) {
        createdVariants.push(null); // Keep index alignment even if skipped
        continue;
      }

      const base = slugify(name, { lower: true, strict: true })
        .replace(/-/g, "")
        .toUpperCase();

      const attrPart = attributes
        .map((a) =>
          (a.value || "").replace(/\s+/g, "").substring(0, 3).toUpperCase()
        )
        .join("-");

      const autoSku = attrPart ? `${base}-${attrPart}` : base;

      const [variantRes] = await connection.query(
        `INSERT INTO product_variants (product_id, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        [product_id, autoSku, price, quantity]
      );
      const variant_id = variantRes.insertId;
      createdVariants.push({ index: i, variant_id }); // Store for image mapping

      // Handle attributes
      for (const attr of attributes) {
        const { name: attrName, value: attrValue } = attr;
        if (!attrName || !attrValue) continue;

        let [attrRow] = await connection.query(
          `SELECT attribute_id FROM attributes WHERE name = ?`,
          [attrName]
        );
        let attribute_id;
        if (attrRow.length === 0) {
          const [newAttr] = await connection.query(
            `INSERT INTO attributes (name) VALUES (?)`,
            [attrName]
          );
          attribute_id = newAttr.insertId;
        } else {
          attribute_id = attrRow[0].attribute_id;
        }

        let [valRow] = await connection.query(
          `SELECT value_id FROM attribute_values WHERE attribute_id = ? AND value = ?`,
          [attribute_id, attrValue]
        );
        let value_id;
        if (valRow.length === 0) {
          const [newVal] = await connection.query(
            `INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)`,
            [attribute_id, attrValue]
          );
          value_id = newVal.insertId;
        } else {
          value_id = valRow[0].value_id;
        }

        await connection.query(
          `INSERT INTO variant_values (variant_id, value_id) VALUES (?, ?)`,
          [variant_id, value_id]
        );
      }
    }

    // 5) Insert images (Enhanced for Many-to-Many)
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        if (!img.url || !img.mimeType) continue;

        if (img.size && img.size > MAX_FILE_SIZE) {
          await connection.rollback();
          return NextResponse.json(
            { error: `Image too large. Max 5MB.` },
            { status: 400 }
          );
        }

        if (!validateImageMimeType(img.mimeType)) {
          await connection.rollback();
          return NextResponse.json(
            { error: `Invalid file type.` },
            { status: 400 }
          );
        }

        const secureFilename = generateSecureFilename(
          img.originalName || `image-${i}`,
          img.mimeType
        );
        const sanitizedOriginal = img.originalName
          ? sanitizeFilename(img.originalName)
          : `image-${i}.jpg`;

        // Insert Image into product_images (WITHOUT variant_id)
        const [imgRes] = await connection.query(
          `INSERT INTO product_images
           (product_id, url, filename, original_filename, alt_text, sort_order, is_primary, mime_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product_id,
            img.url,
            secureFilename,
            sanitizedOriginal,
            img.alt_text || "",
            img.sort_order ?? i,
            img.is_primary === true || i === 0,
            img.mimeType,
          ]
        );
        const imageId = imgRes.insertId;

        // Process Many-to-Many Variant Links
        const variantLinks = [];

        // Handle "variant_ids" array (if present in payload)
        if (Array.isArray(img.variant_ids)) {
          img.variant_ids.forEach((vIdOrIndex) => {
            // Check if it is a "temp" index or real ID (though usually indices in POST)
            // Frontend might send indices as numbers or "temp-X" strings
            let realVariantId = null;

            // Try to resolve if it's an index (number)
            if (typeof vIdOrIndex === "number" && createdVariants[vIdOrIndex]) {
              realVariantId = createdVariants[vIdOrIndex].variant_id;
            }
            // Try to resolve if it's a temp string like "temp-1"
            else if (
              typeof vIdOrIndex === "string" &&
              vIdOrIndex.startsWith("temp-")
            ) {
              const idx = parseInt(vIdOrIndex.replace("temp-", ""), 10);
              if (createdVariants[idx]) {
                realVariantId = createdVariants[idx].variant_id;
              }
            }

            if (realVariantId) {
              variantLinks.push([imageId, realVariantId]);
            }
          });
        }

        // Also handle legacy/single "variant_index" if your frontend still sends it
        // (Just in case mixed data comes in, though "variant_ids" is preferred now)
        if (img.variant_index !== null && img.variant_index !== undefined) {
          if (createdVariants[img.variant_index]) {
            const vId = createdVariants[img.variant_index].variant_id;
            // Avoid duplicates
            if (!variantLinks.find((link) => link[1] === vId)) {
              variantLinks.push([imageId, vId]);
            }
          }
        }

        // Bulk Insert Links
        if (variantLinks.length > 0) {
          await connection.query(
            `INSERT INTO product_image_variants (image_id, variant_id) VALUES ?`,
            [variantLinks]
          );
        }
      }
    }

    await connection.commit();

    // 6) Return full product (Fetching updated many-to-many images structure)
    const [finalProduct] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [product_id]
    );
    const [finalCategories] = await pool.query(
      `SELECT c.* FROM categories c JOIN product_categories pc ON c.category_id = pc.category_id WHERE pc.product_id = ?`,
      [product_id]
    );
    const [finalVariants] = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [product_id]
    );

    // Fetch images with their variant IDs (aggregated)
    const [finalImages] = await pool.query(
      `SELECT pi.*, 
        (SELECT JSON_ARRAYAGG(piv.variant_id) 
         FROM product_image_variants piv 
         WHERE piv.image_id = pi.id) as variant_ids
       FROM product_images pi 
       WHERE pi.product_id = ?`,
      [product_id]
    );

    return NextResponse.json(
      {
        ...finalProduct[0],
        categories: finalCategories,
        variants: finalVariants,
        images: finalImages,
      },
      { status: 201 }
    );
  } catch (err) {
    await connection.rollback();
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
