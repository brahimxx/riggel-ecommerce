import pool from "@/lib/db";
import bcrypt from "bcrypt";

// -- GET /api/users/[id]
export async function GET(req, { params }) {
  const { id } = await params;
  const userId = Number(id);
  if (!userId) {
    return Response.json({ error: "Invalid user ID." }, { status: 400 });
  }

  try {
    // Fetch user by id, no JOIN needed
    const [rows] = await pool.query(
      `SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at
      FROM users
      WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

// -- PUT /api/users/[id]
export async function PUT(req, { params }) {
  const { id } = await params;
  const userId = Number(id);
  if (!userId) {
    return Response.json({ error: "Invalid user ID." }, { status: 400 });
  }

  try {
    const body = await req.json();
    // Using 'role' instead of 'role_id'
    const { username, email, password, role } = body;

    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username.trim());
    }
    if (email) {
      updates.push("email = ?");
      values.push(email.trim());
    }
    if (role) {
      updates.push("role = ?");
      values.push(role);
    }
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return Response.json(
        { message: "No fields to update." },
        { status: 200 }
      );
    }

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch and return the updated user data
    const [updatedUser] = await pool.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    return Response.json(updatedUser[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { error: "Username or email already exists." },
        { status: 409 }
      );
    }
    console.error(error);
    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }
}

// -- DELETE /api/users/[id]
export async function DELETE(req, { params }) {
  const { id } = await params;
  const userId = Number(id);
  if (!userId) {
    return Response.json({ error: "Invalid user ID." }, { status: 400 });
  }

  try {
    // Safety check for user ID 1
    if (userId === 1) {
      return Response.json(
        { error: "Cannot delete the root administrator account." },
        { status: 403 }
      );
    }

    const [result] = await pool.query(`DELETE FROM users WHERE id = ?`, [
      userId,
    ]);

    if (result.affectedRows === 0) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    return Response.json(
      { message: "User deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
