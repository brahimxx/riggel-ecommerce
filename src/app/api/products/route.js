// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";

// Cache JSON for 5 minutes (ISR for the route)
export const revalidate = 300;

// -- GET: All products with their variants (Adjusted for many-to-many categories)
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Extract all filter parameters
  const categoryId = searchParams.get("category_id");
  const colors = searchParams.get("colors")?.split(",");
  const sizes = searchParams.get("sizes")?.split(",");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const offset = (page - 1) * limit;
  const sortBy = searchParams.get("sortBy") || "created_at_desc";

  let joins = [];
  let whereClauses = [];
  const queryParams = [];

  // --- Build the dynamic query ---
  if (categoryId) {
    joins.push(`JOIN product_categories pc ON p.product_id = pc.product_id`);
    whereClauses.push("pc.category_id = ?");
    queryParams.push(categoryId);
  }

  // Price range filter (No change needed)
  if (minPrice && maxPrice) {
    whereClauses.push(
      `(SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) BETWEEN ? AND ?`
    );
    queryParams.push(minPrice, maxPrice);
  }

  // Attribute filters (colors, sizes) (No change needed)
  if ((colors && colors.length > 0) || (sizes && sizes.length > 0)) {
    joins.push(`
      JOIN product_variants pv_filter ON p.product_id = pv_filter.product_id
      JOIN variant_values vv_filter ON pv_filter.variant_id = vv_filter.variant_id
      JOIN attribute_values av_filter ON vv_filter.value_id = av_filter.value_id
      JOIN attributes a_filter ON av_filter.attribute_id = a_filter.attribute_id
    `);

    const attributeConditions = [];
    if (colors && colors.length > 0) {
      attributeConditions.push(
        `(a_filter.name = 'Color' AND av_filter.value IN (?))`
      );
      queryParams.push(colors);
    }
    if (sizes && sizes.length > 0) {
      attributeConditions.push(
        `(a_filter.name = 'Size' AND av_filter.value IN (?))`
      );
      queryParams.push(sizes);
    }
    whereClauses.push(`(${attributeConditions.join(" OR ")})`);
  }

  // --- MODIFICATION: Robust ORDER BY clause ---
  let orderByClause = "";
  switch (sortBy) {
    case "price_asc":
      // For ASC, use 'IS NULL' to push NULLs to the end.
      orderByClause = "ORDER BY price IS NULL, price ASC, p.created_at DESC";
      break;
    case "price_desc":
      // For DESC, MySQL automatically puts NULLs last.
      orderByClause = "ORDER BY price DESC, p.created_at DESC";
      break;
    case "popularity_desc":
      // For DESC, MySQL automatically puts NULLs last.
      orderByClause = "ORDER BY rating DESC, p.created_at DESC";
      break;
    case "created_at_desc":
    default:
      orderByClause = "ORDER BY p.created_at DESC";
      break;
  }

  const joinClause = joins.join("\n");
  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(DISTINCT p.product_id) as total FROM products p ${joinClause} ${whereClause};`;

  const dataQuery = `
  SELECT 
    p.product_id, p.name, p.slug, p.description, p.created_at,
    (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.product_id) AS rating,
    (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) AS price,
    (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.product_id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1) AS main_image,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('category_id', c.category_id, 'name', c.name)) FROM product_categories pc JOIN categories c ON pc.category_id = c.category_id WHERE pc.product_id = p.product_id) AS categories
  FROM products p
  ${joinClause}
  ${whereClause}
  GROUP BY p.product_id
  ${orderByClause}
  LIMIT ?
  OFFSET ?;
`;

  try {
    const [[countResult], [products]] = await Promise.all([
      pool.query(countQuery, queryParams),
      pool.query(dataQuery, [...queryParams, limit, offset]),
    ]);

    const total = countResult[0].total;

    const productsWithParsedCategories = products.map((product) => ({
      ...product,
      categories:
        typeof product.categories === "string"
          ? JSON.parse(product.categories)
          : product.categories || [],
    }));

    return NextResponse.json({ products: productsWithParsedCategories, total });
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
