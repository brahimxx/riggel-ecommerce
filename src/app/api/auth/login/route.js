import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "auth-token";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    // 1. Find the user by username
    const [userRows] = await pool.query(
      "SELECT id, username, password, role FROM users WHERE username = ?",
      [username]
    );

    if (userRows.length === 0) {
      return Response.json(
        { error: "Invalid username or password." },
        { status: 401 } // 401 Unauthorized
      );
    }

    const user = userRows[0];

    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // 3. Create the JWT
    const token = await new SignJWT({ id: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d") // Token expires in 1 day
      .sign(SECRET);

    // 4. Set the token in a secure cookie
    const response = NextResponse.json({
      message: "Login successful.",
      user: { id: user.id, username: user.username, role: user.role },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true, // Prevents client-side JS access
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      path: "/",
      sameSite: "lax",
      maxAge: 86400, // 1 day in seconds
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return Response.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
