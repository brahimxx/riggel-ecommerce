// POST /api/products/by-id - Create a new product and its variants
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";

export async function POST(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const body = await req.json();
    const { name, description, category_id, variants, images } = body;

    if (
      !name ||
      !category_id ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 1. Insert product
    const [prodRes] = await conn.query(
      `INSERT INTO products (name, description, category_id) VALUES (?, ?, ?)`,
      [name, description || "", category_id]
    );
    const product_id = prodRes.insertId;

    // 2. Set slug
    const slug = `${product_id}-${slugify(name, {
      lower: true,
      strict: true,
    })}`;
    await conn.query(`UPDATE products SET slug = ? WHERE product_id = ?`, [
      slug,
      product_id,
    ]);

    // 3. Insert variants and their attributes
    for (const variant of variants) {
      const { sku, price, quantity, attributes } = variant;
      const [variantRes] = await conn.query(
        `INSERT INTO product_variants (product_id, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        [product_id, sku || null, price, quantity]
      );
      const variant_id = variantRes.insertId;

      if (Array.isArray(attributes)) {
        for (const attr of attributes) {
          if (!attr.name || !attr.value) continue;
          // Find or create attribute
          let [attrRow] = await conn.query(
            "SELECT attribute_id FROM attributes WHERE name = ?",
            [attr.name]
          );
          let attribute_id;
          if (attrRow.length === 0) {
            const [newAttr] = await conn.query(
              "INSERT INTO attributes (name) VALUES (?)",
              [attr.name]
            );
            attribute_id = newAttr.insertId;
          } else {
            attribute_id = attrRow[0].attribute_id;
          }
          // Find or create attribute value
          let [valRow] = await conn.query(
            "SELECT value_id FROM attribute_values WHERE attribute_id = ? AND value = ?",
            [attribute_id, attr.value]
          );
          let value_id;
          if (valRow.length === 0) {
            const [newVal] = await conn.query(
              "INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)",
              [attribute_id, attr.value]
            );
            value_id = newVal.insertId;
          } else {
            value_id = valRow[0].value_id;
          }
          // Link variant to attribute value
          await conn.query(
            "INSERT INTO variant_values (variant_id, value_id) VALUES (?, ?)",
            [variant_id, value_id]
          );
        }
      }
    }

    // 4. Handle images
    if (Array.isArray(images)) {
      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        await conn.query(
          `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
          [product_id, img.url, img.alt_text || "", idx, img.is_primary ? 1 : 0]
        );
      }
    }

    await conn.commit();
    conn.release();
    return NextResponse.json({
      message: "Product created successfully.",
      product_id,
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("POST /api/products/by-id error:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
