import pool from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// GET /api/products/[id]
export async function GET(req, { params }) {
  const id = Number(params.id);
  if (!id) {
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  try {
    const [rows] = await pool.query(
      `SELECT p.*, (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE
        LIMIT 1
      ) AS main_image
      FROM products p
      WHERE p.product_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(rows[0]);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]
export async function PUT(req, { params }) {
  const id = Number(params.id);
  if (!id) {
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { name, description, price, category_id, images } = body;

    // Check product exists
    const [existing] = await conn.query(
      "SELECT 1 FROM products WHERE product_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      conn.release();
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    // Update product fields
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
    if (updates.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
        values
      );
    }

    // Handle images update if images array provided
    if (Array.isArray(images)) {
      await conn.beginTransaction();

      // Fetch existing images from DB
      const [existingImages] = await conn.query(
        "SELECT * FROM product_images WHERE product_id = ?",
        [id]
      );

      // Build map for easy lookup by id and by url
      const existingById = new Map();
      existingImages.forEach((img) => existingById.set(img.id, img));

      // IDs sent from frontend
      const sentIds = images.filter((img) => img.id).map((img) => img.id);

      // Delete images removed by user
      if (existingImages.length > 0) {
        const existingIds = existingImages.map((img) => img.id);
        const idsToDelete = existingIds.filter((eid) => !sentIds.includes(eid));
        if (idsToDelete.length > 0) {
          await conn.query(
            `DELETE FROM product_images WHERE id IN (${idsToDelete
              .map(() => "?")
              .join(",")}) AND product_id = ?`,
            [...idsToDelete, id]
          );
        }
      }

      // Validate only one image is primary
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

      // If none is primary, optionally set first image as primary
      if (primaryCount === 0 && images.length > 0) {
        images[0].is_primary = true;
      }

      // Insert new or update existing images
      for (const [index, img] of images.entries()) {
        // Validate image object minimal requirements
        if (!img.url) continue; // skip invalid

        const alt_text = img.alt_text || "";
        const sort_order = img.sort_order ?? index;
        const is_primary = img.is_primary === true;

        if (img.id && existingById.has(img.id)) {
          // Update existing image
          await conn.query(
            `UPDATE product_images SET url = ?, alt_text = ?, sort_order = ?, is_primary = ? WHERE id = ? AND product_id = ?`,
            [img.url, alt_text, sort_order, is_primary, img.id, id]
          );
        } else {
          // Insert new image
          await conn.query(
            `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, ?)`,
            [id, img.url, alt_text, sort_order, is_primary]
          );
        }
      }

      await conn.commit();
    }

    // Fetch updated product with images to return
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
  const id = Number(params.id);
  if (!id) {
    return Response.json({ error: "Invalid product id." }, { status: 400 });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get image URLs before deletion to know which files to remove
    const [images] = await conn.query(
      "SELECT url FROM product_images WHERE product_id = ?",
      [id]
    );

    // Delete images from database
    await conn.query("DELETE FROM product_images WHERE product_id = ?", [id]);

    // Delete the product
    const [result] = await conn.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    await conn.commit();
    conn.release();

    // Delete the image files from disk asynchronously (fire and forget)
    for (const img of images) {
      try {
        // Assuming URLs are like '/images/products_images/filename.ext'
        const filePath = path.join(
          process.cwd(),
          "public",
          img.url.replace(/^\//, "")
        );
        await fs.unlink(filePath);
      } catch (err) {
        // Log error but don't interrupt flow if a single file is missing or deletion fails
        console.error(`Failed to delete image file: ${img.url}`, err);
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
