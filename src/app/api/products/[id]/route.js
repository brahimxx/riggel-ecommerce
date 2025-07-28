import pool from "@/lib/db";

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
  try {
    const body = await req.json();
    const { name, description, price, category_id } = body;

    // Optional: verify product exists before updating
    const [existing] = await pool.query(
      "SELECT 1 FROM products WHERE product_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    // Build update statement
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
    if (updates.length === 0) {
      return Response.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }
    values.push(id);

    await pool.query(
      `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
      values
    );

    // Return updated product
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [id]
    );
    return Response.json(rows[0]);
  } catch (error) {
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
  try {
    const [result] = await pool.query(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    return Response.json({ message: "Product deleted." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
