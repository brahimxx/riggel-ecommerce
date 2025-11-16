// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";

// Cache JSON for 5 minutes (ISR for the route)
export const revalidate = 300;

// -- GET: All products with their variants (Adjusted for many-to-many categories)

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const categoryId = searchParams.get("category_id");
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

  // ---- Category filter ----
  if (categoryId) {
    whereClauses.push(
      `EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.product_id AND pc.category_id = ?)`
    );
    queryParams.push(categoryId);
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
  // Add sorting parameters if search query exists
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

// -- POST: Create new product with variants (Adjusted for many-to-many categories)
export async function POST(req) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await req.json();
    // MODIFICATION: Expect 'category_ids' to be an array
    const { name, description, category_ids, images, variants } = body;

    // Basic validation
    if (
      !name ||
      !description ||
      !Array.isArray(category_ids) || // MODIFICATION: Check for array
      category_ids.length === 0 || // MODIFICATION: Ensure at least one category
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

    // 1) MODIFICATION: Insert base product without category_id
    const [prodRes] = await connection.query(
      `INSERT INTO products (name, description) VALUES (?, ?)`,
      [name, description]
    );
    const product_id = prodRes.insertId;

    // 2) MODIFICATION: Link product to its categories in the junction table
    const categoryValues = category_ids.map((catId) => [product_id, catId]);
    await connection.query(
      `INSERT INTO product_categories (product_id, category_id) VALUES ?`,
      [categoryValues]
    );

    // 3) Build and save the slug (No changes needed here, just re-numbered)
    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${product_id}-${baseSlug}`;
    await connection.query(
      `UPDATE products SET slug = ? WHERE product_id = ?`,
      [slug, product_id]
    );

    // 4) Loop through and insert variants and their attributes (No changes needed)
    for (const variant of variants) {
      const { sku, price, quantity, attributes } = variant;
      if (
        typeof price !== "number" ||
        typeof quantity !== "number" ||
        !Array.isArray(attributes)
      ) {
        // Skip invalid variants
        continue;
      }

      // Insert the variant
      const [variantRes] = await connection.query(
        `INSERT INTO product_variants (product_id, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        [product_id, sku || null, price, quantity]
      );
      const variant_id = variantRes.insertId;

      // Handle its attributes
      for (const attr of attributes) {
        const { name: attrName, value: attrValue } = attr;
        if (!attrName || !attrValue) continue;

        // Find or create attribute (e.g., 'Color')
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

        // Find or create attribute value (e.g., 'Red')
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

        // Link them in the join table
        await connection.query(
          `INSERT INTO variant_values (variant_id, value_id) VALUES (?, ?)`,
          [variant_id, value_id]
        );
      }
    }

    // 5) Insert images (if any) (No changes needed)
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await connection.query(
          `
                INSERT INTO product_images
                    (product_id, url, alt_text, sort_order, is_primary)
                VALUES (?, ?, ?, ?, ?)
                `,
          [
            product_id,
            img.url,
            img.alt_text || "",
            img.sort_order ?? i,
            img.is_primary === true || i === 0,
          ]
        );
      }
    }

    await connection.commit();

    // 6) Fetch and return the full, newly created product object
    // MODIFICATION: Fetch categories from the junction table
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
    const [finalImages] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ?`,
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
