// app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";
import fs from "fs/promises";
import path from "path";

// Optional: cache this product JSON for 5 minutes
export const revalidate = 300;

// GET /api/products/[id]
export async function GET(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }
  try {
    // Product with slug + rating
    const [rows] = await pool.query(
      `SELECT product_id, name, slug, description, price, category_id, created_at, quantity, rating
       FROM products WHERE product_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = rows[0];

    // Images with metadata
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    return NextResponse.json({ ...product, images });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]
export async function PUT(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  let imagesToDelete = [];
  try {
    const body = await req.json();
    const { name, description, price, category_id, quantity, images, rating } =
      body;

    // Check product exists
    const [existing] = await conn.query(
      "SELECT product_id, name FROM products WHERE product_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      conn.release();
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }
    const current = existing[0];

    // Validate rating if provided
    if (typeof rating !== "undefined") {
      const r = Number(rating);
      if (Number.isNaN(r) || r < 0 || r > 5) {
        conn.release();
        return NextResponse.json(
          { error: "Rating must be between 0 and 5." },
          { status: 400 }
        );
      }
    }

    await conn.beginTransaction();

    // Update product fields if provided
    const updates = [];
    const values = [];

    if (typeof name === "string") {
      updates.push("name = ?");
      values.push(name);
    }
    if (typeof description === "string") {
      updates.push("description = ?");
      values.push(description);
    }
    if (typeof price === "number") {
      updates.push("price = ?");
      values.push(price);
    }
    if (category_id) {
      updates.push("category_id = ?");
      values.push(category_id);
    }
    if (typeof quantity === "number") {
      updates.push("quantity = ?");
      values.push(quantity);
    }
    if (typeof rating === "number") {
      updates.push("rating = ?");
      values.push(rating);
    }

    if (updates.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
        values
      );
    }

    // If name changed, regenerate slug: "<id>-<slugified-name>"
    if (typeof name === "string" && name !== current.name) {
      const base = slugify(name, { lower: true, strict: true });
      const newSlug = `${id}-${base}`;
      await conn.query(`UPDATE products SET slug = ? WHERE product_id = ?`, [
        newSlug,
        id,
      ]);
    }

    // Handle images if array provided
    if (Array.isArray(images)) {
      // Fetch current images
      const [existingImages] = await conn.query(
        "SELECT * FROM product_images WHERE product_id = ?",
        [id]
      );
      const existingById = new Map();
      existingImages.forEach((img) => existingById.set(img.id, img));

      const sentIds = images.filter((img) => img.id).map((img) => img.id);

      // Deleted images
      if (existingImages.length > 0) {
        const existingIds = existingImages.map((img) => img.id);
        const idsToDelete = existingIds.filter((eid) => !sentIds.includes(eid));

        if (idsToDelete.length > 0) {
          const placeholders = idsToDelete.map(() => "?").join(",");
          const [rowsToDelete] = await conn.query(
            `SELECT url FROM product_images WHERE id IN (${placeholders}) AND product_id = ?`,
            [...idsToDelete, id]
          );
          imagesToDelete = rowsToDelete.map((row) => row.url);

          await conn.query(
            `DELETE FROM product_images WHERE id IN (${placeholders}) AND product_id = ?`,
            [...idsToDelete, id]
          );
        }
      }

      // Only 1 primary image
      const primaryCount = images.filter(
        (img) => img.is_primary === true
      ).length;
      if (primaryCount > 1) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          { error: "Only one image can be set as primary." },
          { status: 400 }
        );
      }
      if (primaryCount === 0 && images.length > 0) {
        images[0].is_primary = true;
      }

      // Upsert images
      for (const [index, img] of images.entries()) {
        if (!img.url) continue;
        const alt_text = img.alt_text || "";
        const sort_order = img.sort_order ?? index;
        const is_primary = img.is_primary === true;

        if (img.id && existingById.has(img.id)) {
          await conn.query(
            `UPDATE product_images
             SET url = ?, alt_text = ?, sort_order = ?, is_primary = ?
             WHERE id = ? AND product_id = ?`,
            [img.url, alt_text, sort_order, is_primary, img.id, id]
          );
        } else {
          await conn.query(
            `INSERT INTO product_images
               (product_id, url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, ?)`,
            [id, img.url, alt_text, sort_order, is_primary]
          );
        }
      }
    }

    await conn.commit();

    // Delete orphaned files
    for (const imgUrl of imagesToDelete) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          imgUrl.replace(/^\//, "")
        );
        await fs.unlink(filePath);
      } catch (err) {
        console.error(
          `Failed to delete image file during update: ${imgUrl}`,
          err
        );
      }
    }

    // Return updated product
    const [updatedProducts] = await conn.query(
      `SELECT product_id, name, slug, description, price, category_id, created_at, quantity, rating
       FROM products WHERE product_id = ?`,
      [id]
    );
    const [updatedImages] = await conn.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    conn.release();
    return NextResponse.json({ ...updatedProducts[0], images: updatedImages });
  } catch (error) {
    await conn.rollback();
    conn.release();
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  let imagesToDelete = [];
  try {
    await conn.beginTransaction();

    const [images] = await conn.query(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );
    imagesToDelete = images.map((img) => img.url);

    await conn.query("DELETE FROM product_images WHERE product_id = ?", [id]);

    const [result] = await conn.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    await conn.commit();
    conn.release();

    for (const url of imagesToDelete) {
      if (typeof url === "string" && url.length && url.startsWith("/")) {
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
      } else {
        console.warn("Skipping invalid or empty image URL:", url);
      }
    }

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Product and images deleted." },
      { status: 200 }
    );
  } catch (error) {
    await conn.rollback();
    conn.release();
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
