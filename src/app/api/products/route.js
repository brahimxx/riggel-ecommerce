// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";

// Cache JSON for 5 minutes (ISR for the route)
export const revalidate = 300;

// -- GET: All products with their variants
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Extract all filter parameters
  const categoryId = searchParams.get("category_id");
  const colors = searchParams.get("colors")?.split(",");
  const sizes = searchParams.get("sizes")?.split(",");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  let joins = [];
  let whereClauses = [];
  const queryParams = [];

  // --- Build the dynamic query ---
  if (categoryId) {
    whereClauses.push("p.category_id = ?");
    queryParams.push(categoryId);
  }

  // Price range filter now uses the MIN(price) subquery
  if (minPrice && maxPrice) {
    whereClauses.push(
      `(SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) BETWEEN ? AND ?`
    );
    queryParams.push(minPrice, maxPrice);
  }

  // Attribute filters (colors, sizes)
  if ((colors && colors.length > 0) || (sizes && sizes.length > 0)) {
    // This join is necessary to filter by attributes
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

  const joinClause = joins.join("\n");
  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // The main query now includes the subqueries for rating and price
  const sqlQuery = `
    SELECT DISTINCT
      p.product_id, 
      p.name, 
      p.slug, 
      p.description, 
      p.category_id, 
      p.created_at,
      -- Subquery for average rating
      (
        SELECT AVG(r.rating)
        FROM reviews r
        WHERE r.product_id = p.product_id
      ) AS rating,
      -- Subquery for the minimum price among variants
      (
        SELECT MIN(pv.price)
        FROM product_variants pv
        WHERE pv.product_id = p.product_id
      ) AS price,
      -- Subquery for the primary image
      (
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = p.product_id
        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
        LIMIT 1
      ) AS main_image
    FROM products p
    ${joinClause}
    ${whereClause}
    GROUP BY p.product_id
    ORDER BY p.created_at DESC;
  `;

  try {
    const [products] = await pool.query(sqlQuery, queryParams);
    return NextResponse.json(products);
  } catch (err) {
    console.error(
      "GET /api/products error:",
      err,
      "Query:",
      sqlQuery,
      "Params:",
      queryParams
    );
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// -- POST: Create new product with variants
export async function POST(req) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await req.json();
    const { name, description, category_id, images, variants } = body;

    // Basic validation
    if (
      !name ||
      !description ||
      !category_id ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    // 1) Insert base product to get an ID
    const [prodRes] = await connection.query(
      `INSERT INTO products (name, description, category_id) VALUES (?, ?, ?)`,
      [name, description, category_id]
    );
    const product_id = prodRes.insertId;

    // 2) Build and save the slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${product_id}-${baseSlug}`;
    await connection.query(
      `UPDATE products SET slug = ? WHERE product_id = ?`,
      [slug, product_id]
    );

    // 3) Loop through and insert variants and their attributes
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

    // 4) Insert images (if any)
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

    // 5) Fetch and return the full, newly created product object
    const [finalProduct] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
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
      { ...finalProduct[0], variants: finalVariants, images: finalImages },
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
    connection.release();
  }
}
