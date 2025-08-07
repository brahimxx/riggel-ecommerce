import pool from "@/lib/db";
import bcrypt from "bcrypt";

// -- GET: All users
export async function GET(req) {
  try {
    // No JOIN needed anymore, as 'role' is in the users table.
    const [users] = await pool.query(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at
      FROM users
      ORDER BY username ASC
    `);
    return Response.json(users);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

// -- POST: Create a new user
export async function POST(req) {
  try {
    const body = await req.json();
    // Using 'role' directly instead of 'role_id'
    const { username, email, password, role } = body;

    // Basic validation
    if (!username || !email || !password || !role) {
      return Response.json(
        { error: "Username, email, password, and role are required." },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length > 0) {
      return Response.json(
        { error: "Username or email already in use." },
        { status: 409 } // 409 Conflict
      );
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user with the new schema
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [username.trim(), email.trim(), hashedPassword, role]
    );
    const userId = result.insertId;

    // Return the newly created user (without the password hash)
    const [newUser] = await pool.query(
      `SELECT id, username, email, role, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    return Response.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create user." }, { status: 500 });
  }
}
