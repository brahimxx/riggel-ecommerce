// app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";
import fs from "fs/promises";
import path from "path";

export async function GET(req, { params }) {
  const { id } = await params; // Correct async access of params.id
  const numericId = Number(id);

  if (!numericId || isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT product_id, name, slug, description, created_at FROM products WHERE product_id = ?`,
      [numericId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = rows[0];

    const [categories] = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [numericId]
    );

    const [variantsRaw] = await pool.query(
      `
      SELECT 
        pv.variant_id, pv.sku, pv.price, pv.quantity,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('name', a.name, 'value', av.value)
          )
          FROM variant_values vv
          JOIN attribute_values av ON vv.value_id = av.value_id
          JOIN attributes a ON av.attribute_id = a.attribute_id
          WHERE vv.variant_id = pv.variant_id
        ) AS attributes
      FROM product_variants pv
      WHERE pv.product_id = ?
      `,
      [numericId]
    );

    const variants = variantsRaw.map((v) => ({
      ...v,
      attributes:
        typeof v.attributes === "string"
          ? JSON.parse(v.attributes)
          : v.attributes || [],
    }));

    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [numericId]
    );

    return NextResponse.json({ ...product, categories, variants, images });
  } catch (error) {
    console.error(`GET /api/products/${numericId} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id: paramId } = await params;
  const id = Number(paramId);

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const body = await req.json();
    // MODIFICATION: Expect 'category_ids' array
    const { name, description, category_ids, variants, images } = body;

    // 1. Update base product details (name, description)
    const updates = [],
      values = [];
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description) {
      updates.push("description = ?");
      values.push(description);
    }
    if (updates.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
        values
      );
    }
    if (name) {
      const newSlug = `${id}-${slugify(name, { lower: true, strict: true })}`;
      await conn.query(`UPDATE products SET slug = ? WHERE product_id = ?`, [
        newSlug,
        id,
      ]);
    }

    // 2. MODIFICATION: Handle category updates
    if (Array.isArray(category_ids)) {
      // First, remove all existing category associations for this product
      await conn.query("DELETE FROM product_categories WHERE product_id = ?", [
        id,
      ]);
      // Then, insert the new ones, if any
      if (category_ids.length > 0) {
        const categoryValues = category_ids.map((catId) => [id, catId]);
        await conn.query(
          `INSERT INTO product_categories (product_id, category_id) VALUES ?`,
          [categoryValues]
        );
      }
    }

    // 2. Handle Variants (Create, Update, Delete) with Attributes
    if (Array.isArray(variants)) {
      const [existingVariants] = await conn.query(
        "SELECT variant_id FROM product_variants WHERE product_id = ?",
        [id]
      );
      const existingVariantIds = existingVariants.map((v) => v.variant_id);
      const incomingVariantIds = variants
        .map((v) => v.variant_id)
        .filter(Boolean);

      const variantsToDelete = existingVariantIds.filter(
        (vid) => !incomingVariantIds.includes(vid)
      );
      if (variantsToDelete.length > 0) {
        await conn.query(
          "DELETE FROM product_variants WHERE variant_id IN (?)",
          [variantsToDelete]
        );
      }

      for (const variant of variants) {
        let variant_id = variant.variant_id;
        let sku = variant.sku;
        // Auto-generate SKU if missing
        if (!sku || sku.trim() === "") {
          const base = slugify(name, { lower: true, strict: true })
            .replace(/-/g, "")
            .toUpperCase();
          const attrPart = Array.isArray(variant.attributes)
            ? variant.attributes
                .map((a) =>
                  (a.value || "")
                    .replace(/\s+/g, "")
                    .substring(0, 3)
                    .toUpperCase()
                )
                .join("-")
            : "";
          sku = attrPart ? `${base}-${attrPart}` : base;
        }
        // A. Upsert the variant
        if (variant_id) {
          // Update existing variant
          await conn.query(
            "UPDATE product_variants SET price = ?, quantity = ?, sku = ? WHERE variant_id = ?",
            [variant.price, variant.quantity, sku, variant_id]
          );
        } else {
          // Create new variant
          const [newVariant] = await conn.query(
            "INSERT INTO product_variants (product_id, price, quantity, sku) VALUES (?, ?, ?, ?)",
            [id, variant.price, variant.quantity, sku]
          );
          variant_id = newVariant.insertId;
        }

        // B. Handle attributes for the variant
        if (Array.isArray(variant.attributes)) {
          // First, clear old attribute links for this variant
          await conn.query("DELETE FROM variant_values WHERE variant_id = ?", [
            variant_id,
          ]);

          // Then, add the new ones
          for (const attr of variant.attributes) {
            if (!attr.name || !attr.value) continue;

            // Find or create attribute name (e.g., 'Color')
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

            // Find or create attribute value (e.g., 'Red')
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
    }

    // 3. Handle Images: delete old, insert new (support variant_id)
    await conn.query("DELETE FROM product_images WHERE product_id = ?", [id]);
    if (Array.isArray(images)) {
      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        await conn.query(
          `INSERT INTO product_images (product_id, variant_id, url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            img.variant_id || null,
            img.url,
            img.alt_text || "",
            idx,
            img.is_primary ? 1 : 0,
          ]
        );
      }
    }

    await conn.commit();
    return NextResponse.json({ message: "Product updated successfully." });
  } catch (error) {
    await conn.rollback();
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(req, { params }) {
  const { id: paramId } = await params;
  const id = Number(paramId);

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [inOrder] = await conn.query(
      `SELECT 1 FROM order_items oi JOIN product_variants pv ON oi.variant_id = pv.variant_id WHERE pv.product_id = ? LIMIT 1`,
      [id]
    );

    if (inOrder.length > 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        {
          error:
            "Cannot delete: product variants are referenced in existing orders.",
        },
        { status: 409 }
      );
    }

    const [images] = await conn.query(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );
    const imagesToDelete = images.map((img) => img.url);

    const [result] = await conn.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    await conn.commit();

    for (const url of imagesToDelete) {
      if (url?.startsWith("/")) {
        try {
          const filePath = path.join(
            process.cwd(),
            "public",
            url.replace(/^\//, "")
          );
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete image file: ${url}`, err);
        }
      }
    }

    conn.release();
    return NextResponse.json({
      message: "Product and all its variants deleted successfully.",
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
