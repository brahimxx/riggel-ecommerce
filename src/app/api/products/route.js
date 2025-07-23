import pool from "@/lib/db";

// --- GET: All products (with filtering) ---
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const categoryId = searchParams.get("category_id");
  const minPrice = searchParams.get("price_min");
  const maxPrice = searchParams.get("price_max");
  const filters = [];
  const values = [];

  if (categoryId) {
    filters.push("p.category_id = ?");
    values.push(categoryId);
  }
  if (minPrice) {
    filters.push("p.price >= ?");
    values.push(minPrice);
  }
  if (maxPrice) {
    filters.push("p.price <= ?");
    values.push(maxPrice);
  }
  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [products] = await pool.query(
      `SELECT p.*, (
          SELECT url
          FROM product_images pi
          WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS main_image
      FROM products p
      ${whereClause}
      `
    );
    return Response.json(products);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// --- GET: Single product by ID ---
export async function getProductById(id) {
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

// --- POST: Create new product ---
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, price, category_id } = body;

    if (!name || !description || typeof price !== "number" || !category_id) {
      return Response.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, description, price, category_id)
       VALUES (?, ?, ?, ?)`,
      [name, description, price, category_id]
    );

    return Response.json({ insertedId: result.insertId }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}

// --- PUT: Update product by ID ---
export async function PUT(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { name, description, price, category_id } = body;

    if (!name && !description && !price && !category_id) {
      return Response.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    // Build update query
    const updates = [];
    const values = [];
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description) {
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
    values.push(id);

    const [result] = await pool.query(
      `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    return Response.json({ message: "Product updated." });
  } catch (error) {
    return Response.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

// --- DELETE: Remove product by ID ---
export async function DELETE(req, { params }) {
  try {
    const id = params.id;
    const [result] = await pool.query(
      `DELETE FROM products WHERE product_id = ?`,
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
