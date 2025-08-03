import pool from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// GET /api/products/[id]
export async function GET(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  try {
    // 1. Fetch product data
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    const product = rows[0];

    // 2. Fetch all images for the product with metadata
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    // 3. Return combined product + images
    return Response.json({ ...product, images });
  } catch (error) {
    return Response.json(
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
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  const conn = await pool.getConnection();
  let imagesToDelete = [];
  try {
    const body = await req.json();
    const { name, description, price, category_id, quantity, images } = body;

    // Check product exists
    const [existing] = await conn.query(
      "SELECT 1 FROM products WHERE product_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      conn.release();
      return Response.json({ error: "Product not found." }, { status: 404 });
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
    if (updates.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
        values
      );
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

      // IDs sent from client
      const sentIds = images.filter((img) => img.id).map((img) => img.id);

      // Identify deleted images, collect their URLs
      if (existingImages.length > 0) {
        const existingIds = existingImages.map((img) => img.id);
        const idsToDelete = existingIds.filter((eid) => !sentIds.includes(eid));
        if (idsToDelete.length > 0) {
          // Fetch URLs for these images before deleting from DB
          const [rowsToDelete] = await conn.query(
            `SELECT url FROM product_images WHERE id IN (${idsToDelete
              .map(() => "?")
              .join(",")}) AND product_id = ?`,
            [...idsToDelete, id]
          );
          imagesToDelete = rowsToDelete.map((row) => row.url);

          await conn.query(
            `DELETE FROM product_images WHERE id IN (${idsToDelete
              .map(() => "?")
              .join(",")}) AND product_id = ?`,
            [...idsToDelete, id]
          );
        }
      }

      // Validate only 1 primary image
      const primaryCount = images.filter(
        (img) => img.is_primary === true
      ).length;
      if (primaryCount > 1) {
        await conn.rollback();
        conn.release();
        return Response.json(
          { error: "Only one image can be set as primary." },
          { status: 400 }
        );
      }
      if (primaryCount === 0 && images.length > 0) {
        images[0].is_primary = true; // default first image to primary
      }

      // Insert or update images
      for (const [index, img] of images.entries()) {
        if (!img.url) continue; // skip invalid
        const alt_text = img.alt_text || "";
        const sort_order = img.sort_order ?? index;
        const is_primary = img.is_primary === true;

        if (img.id && existingById.has(img.id)) {
          // update existing
          await conn.query(
            `UPDATE product_images SET url = ?, alt_text = ?, sort_order = ?, is_primary = ? WHERE id = ? AND product_id = ?`,
            [img.url, alt_text, sort_order, is_primary, img.id, id]
          );
        } else {
          // insert new
          await conn.query(
            `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, ?)`,
            [id, img.url, alt_text, sort_order, is_primary]
          );
        }
      }
    }

    await conn.commit();

    // After commit, delete the files for orphaned images
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

    // Fetch updated product + images to return
    const [updatedProducts] = await conn.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [id]
    );
    const [updatedImages] = await conn.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    conn.release();
    return Response.json({ ...updatedProducts[0], images: updatedImages });
  } catch (error) {
    await conn.rollback();
    conn.release();
    return Response.json(
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
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  const conn = await pool.getConnection();
  let imagesToDelete = [];
  try {
    await conn.beginTransaction();

    // Get image URLs before deletion to delete their files
    const [images] = await conn.query(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );
    imagesToDelete = images.map((img) => img.url);

    // Delete product images records
    await conn.query("DELETE FROM product_images WHERE product_id = ?", [id]);

    // Delete product record
    const [result] = await conn.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    await conn.commit();
    conn.release();

    // Delete files from disk after successful commit
    for (const url of imagesToDelete) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          url.replace(/^\//, "")
        );
        await fs.unlink(filePath);
      } catch (err) {
        // Log but don't disrupt flow
        console.error(`Failed to delete image file: ${url}`, err);
      }
    }

    if (result.affectedRows === 0) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    return Response.json(
      { message: "Product and images deleted." },
      { status: 200 }
    );
  } catch (error) {
    await conn.rollback();
    conn.release();
    return Response.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
