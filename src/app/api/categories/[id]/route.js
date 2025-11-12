import pool from "@/lib/db";

// GET /api/categories/[id] - (No changes needed)
export async function GET(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid category id." }, { status: 400 });
  }
  try {
    // Fetch category by id
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE category_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return Response.json(
      { error: "Failed to fetch category." },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - (No changes needed)
export async function PUT(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid category id." }, { status: 400 });
  }
  const conn = await pool.getConnection();

  try {
    const body = await req.json();
    const { name, parent_category_id, description, category_type } = body;

    // Check category exists
    const [existing] = await conn.query(
      "SELECT 1 FROM categories WHERE category_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      conn.release();
      return Response.json({ error: "Category not found." }, { status: 404 });
    }

    await conn.beginTransaction();

    // Update fields if provided
    const updates = [];
    const values = [];

    if (typeof name === "string") {
      updates.push("name = ?");
      values.push(name.trim());
    }
    if (parent_category_id === null || parent_category_id === undefined) {
      updates.push("parent_category_id = NULL");
    } else if (typeof parent_category_id === "number") {
      updates.push("parent_category_id = ?");
      values.push(parent_category_id);
    }
    if (typeof description === "string") {
      updates.push("description = ?");
      values.push(description);
    }
    if (typeof category_type === "string") {
      updates.push("category_type = ?");
      values.push(category_type.trim());
    }

    if (updates.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE categories SET ${updates.join(", ")} WHERE category_id = ?`,
        values
      );
    }

    await conn.commit();

    // Fetch updated category
    const [updatedCategories] = await conn.query(
      `SELECT * FROM categories WHERE category_id = ?`,
      [id]
    );

    conn.release();
    return Response.json(updatedCategories[0]);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Failed to update category:", error);
    return Response.json(
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - (Adjusted)
export async function DELETE(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid category id." }, { status: 400 });
  }
  try {
    // 1. Check category exists
    const [existingCat] = await pool.query(
      `SELECT 1 FROM categories WHERE category_id = ? LIMIT 1`,
      [id]
    );
    if (existingCat.length === 0) {
      return Response.json({ error: "Category not found." }, { status: 404 });
    }

    // 2. Check if category has assigned products (using the new junction table)
    const [prodCountRes] = await pool.query(
      `SELECT COUNT(*) AS product_count FROM product_categories WHERE category_id = ?`,
      [id]
    );
    const productCount = prodCountRes[0]?.product_count ?? 0;

    if (productCount > 0) {
      return Response.json(
        {
          error: `Category cannot be deleted because it has ${productCount} product(s) assigned.`,
        },
        { status: 400 }
      );
    }

    // 3. Safe to delete the category
    // Because of the `ON DELETE CASCADE` constraint on the product_categories table,
    // you only need to delete from the `categories` table. The database will handle the rest.
    const [result] = await pool.query(
      `DELETE FROM categories WHERE category_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      // This case is unlikely if the first check passed, but it's good practice.
      return Response.json({ error: "Category not found." }, { status: 404 });
    }

    return Response.json({ message: "Category deleted." }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete category:", error);
    // This will catch errors if, for example, the category is a parent to other sub-categories
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return Response.json(
        {
          error:
            "Category cannot be deleted because it is a parent to other categories.",
        },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}
