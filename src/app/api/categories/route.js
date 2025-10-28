import pool from "@/lib/db";

// -- GET: All categories (adjusted for many-to-many relationship)
export async function GET(req) {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.*,
        COUNT(pc.product_id) AS product_count
      FROM categories c
      LEFT JOIN product_categories pc ON pc.category_id = c.category_id
      GROUP BY c.category_id
      ORDER BY c.name ASC
    `);
    return Response.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error); // Log the error for debugging
    return Response.json(
      { error: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

// -- POST: Create new category (No changes needed)
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, parent_category_id, description } = body;

    if (typeof name !== "string" || name.trim() === "") {
      return Response.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    // Insert category
    const [catRes] = await pool.query(
      `INSERT INTO categories (name, parent_category_id, description)
       VALUES (?, ?, ?)`,
      [name.trim(), parent_category_id || null, description || ""]
    );
    const category_id = catRes.insertId;

    // Return the newly created category
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE category_id = ?`,
      [category_id]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error); // Log the error for debugging
    return Response.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}
