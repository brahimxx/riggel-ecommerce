// app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";
import fs from "fs/promises";
import { randomBytes } from "crypto"; // ADD THIS
import { unlink } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(req, { params }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!numericId || isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  try {
    // Enhanced query with rating and sale info
    const [rows] = await pool.query(
      `SELECT 
        p.product_id, 
        p.name, 
        p.slug, 
        p.description, 
        p.created_at,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.product_id) AS rating,
        (SELECT SUM(pv.quantity) FROM product_variants pv WHERE pv.product_id = p.product_id) AS total_variants_quantities,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN product_variants pv ON oi.variant_id = pv.variant_id
          WHERE pv.product_id = p.product_id
        ), 0) AS total_orders
      FROM products p 
      WHERE p.product_id = ?`,
      [numericId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = rows[0];

    // Fetch categories (many-to-many)
    const [categories] = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [numericId]
    );

    // Fetch variants with attributes
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

    // Fetch images with enhanced security fields
    const [images] = await pool.query(
      `SELECT 
        id, 
        product_id,
        variant_id,
        url, 
        filename, 
        original_filename, 
        alt_text, 
        sort_order, 
        is_primary, 
        mime_type 
      FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      [numericId]
    );

    // Fetch active sale information
    const [saleInfo] = await pool.query(
      `SELECT 
        s.id AS sale_id,
        s.name AS sale_name,
        s.discount_type,
        s.discount_value
      FROM sales s
      JOIN sale_product sp ON s.id = sp.sale_id
      WHERE sp.product_id = ?
        AND s.start_date <= NOW() 
        AND s.end_date >= NOW()
      LIMIT 1`,
      [numericId]
    );

    return NextResponse.json({
      ...product,
      categories,
      variants,
      images,
      // Add sale info if exists
      sale_id: saleInfo.length > 0 ? saleInfo[0].sale_id : null,
      sale_name: saleInfo.length > 0 ? saleInfo[0].sale_name : null,
      discount_type: saleInfo.length > 0 ? saleInfo[0].discount_type : null,
      discount_value: saleInfo.length > 0 ? saleInfo[0].discount_value : null,
    });
  } catch (error) {
    console.error(`GET /api/products/${numericId} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

// app/api/products/by-id/[id]/route.js
export async function PUT(req, { params }) {
  // Helper function to generate secure filenames
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

  // Helper to validate file type
  function validateImageMimeType(mimeType) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return allowedTypes.includes(mimeType);
  }

  // Sanitize filename
  function sanitizeFilename(filename) {
    let sanitized = filename.replace(/[\/\\]/g, "");
    sanitized = sanitized.replace(/\0/g, "");
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
    sanitized = sanitized.replace(/^\.+/, "");

    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }

    return sanitized || "unnamed";
  }

  const { id: paramId } = await params;
  const id = Number(paramId);

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const body = await req.json();
    const { name, description, category_ids, variants, images, deletedImages } =
      body;

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

    // 2. Handle category updates (many-to-many)
    if (Array.isArray(category_ids)) {
      await conn.query("DELETE FROM product_categories WHERE product_id = ?", [
        id,
      ]);
      if (category_ids.length > 0) {
        const categoryValues = category_ids.map((catId) => [id, catId]);
        await conn.query(
          `INSERT INTO product_categories (product_id, category_id) VALUES ?`,
          [categoryValues]
        );
      }
    }

    // 3. Handle Variants (Create, Update, Delete) with Attributes
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
          await conn.query(
            "UPDATE product_variants SET price = ?, quantity = ?, sku = ? WHERE variant_id = ?",
            [variant.price, variant.quantity, sku, variant_id]
          );
        } else {
          const [newVariant] = await conn.query(
            "INSERT INTO product_variants (product_id, price, quantity, sku) VALUES (?, ?, ?, ?)",
            [id, variant.price, variant.quantity, sku]
          );
          variant_id = newVariant.insertId;
        }

        // B. Handle attributes for the variant
        if (Array.isArray(variant.attributes)) {
          await conn.query("DELETE FROM variant_values WHERE variant_id = ?", [
            variant_id,
          ]);

          for (const attr of variant.attributes) {
            if (!attr.name || !attr.value) continue;

            // Find or create attribute name
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

            await conn.query(
              "INSERT INTO variant_values (variant_id, value_id) VALUES (?, ?)",
              [variant_id, value_id]
            );
          }
        }
      }
    }

    // 4. Handle Images - Delete physical files FIRST
    if (Array.isArray(deletedImages) && deletedImages.length > 0) {
      for (const url of deletedImages) {
        try {
          if (url?.startsWith("/images/products_images/")) {
            const filePath = path.join(
              process.cwd(),
              "public",
              url.replace(/^\//, "")
            );
            await unlink(filePath);
            console.log(`✅ Deleted file: ${filePath}`);
          }
        } catch (err) {
          console.error(`❌ Failed to delete image file: ${url}`, err);
        }
      }
      // Delete specific records from DB
      await conn.query(
        "DELETE FROM product_images WHERE product_id = ? AND url IN (?)",
        [id, deletedImages]
      );
    }

    if (Array.isArray(images)) {
      // Get current images to check existence
      const [currentDbImages] = await conn.query(
        "SELECT id FROM product_images WHERE product_id = ?",
        [id]
      );
      const currentIds = currentDbImages.map((i) => i.id);

      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Case 1: Existing Image (has ID and ID exists in DB)
        if (img.id && currentIds.includes(img.id)) {
          await conn.query(
            `UPDATE product_images 
                 SET variant_id = ?, alt_text = ?, sort_order = ?, is_primary = ? 
                 WHERE id = ?`,
            [
              img.variant_id || null,
              img.alt_text || "",
              img.sort_order ?? i,
              img.is_primary ? 1 : 0,
              img.id,
            ]
          );
        }
        // Case 2: New Image (needs insertion)
        else {
          // ... Validate size/type (your existing validation logic) ...
          if (!img.url || !img.mimeType) continue; // Skip invalid

          // Generate filenames ONLY for new images
          const secureFilename = img.url.split("/").pop(); // e.g. "8f92a...jpg"
          const sanitizedOriginal = img.originalName
            ? sanitizeFilename(img.originalName)
            : `image-${i}.jpg`;

          await conn.query(
            `INSERT INTO product_images 
                (product_id, variant_id, url, filename, original_filename, alt_text, sort_order, is_primary, mime_type) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              img.variant_id || null,
              img.url, // This URL comes from your upload API response
              secureFilename,
              sanitizedOriginal,
              img.alt_text || "",
              img.sort_order ?? i,
              img.is_primary ? 1 : 0,
              img.mimeType,
            ]
          );
        }
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

    // Check if product exists first
    const [productExists] = await conn.query(
      "SELECT 1 FROM products WHERE product_id = ? LIMIT 1",
      [id]
    );

    if (productExists.length === 0) {
      await conn.rollback();
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Check if product variants are referenced in existing orders
    const [inOrder] = await conn.query(
      `SELECT 1 FROM order_items oi 
       JOIN product_variants pv ON oi.variant_id = pv.variant_id 
       WHERE pv.product_id = ? 
       LIMIT 1`,
      [id]
    );

    if (inOrder.length > 0) {
      await conn.rollback();
      return NextResponse.json(
        {
          error:
            "Cannot delete: product variants are referenced in existing orders.",
        },
        { status: 409 }
      );
    }

    // Fetch all images to delete from filesystem
    const [images] = await conn.query(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );
    const imagesToDelete = images.map((img) => img.url);

    // Delete product (cascades will handle variants, images, categories, etc.)
    const [result] = await conn.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    await conn.commit();

    // Clean up image files from filesystem after successful DB deletion
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
          // Log but don't fail the request if file deletion fails
          console.error(`Failed to delete image file: ${url}`, err);
        }
      }
    }

    return NextResponse.json({
      message: "Product and all its variants deleted successfully.",
    });
  } catch (error) {
    await conn.rollback();
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
