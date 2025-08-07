import { NextResponse } from "next/server";

const COOKIE_NAME = "auth-token";

export async function POST(req) {
  const response = NextResponse.json({ message: "Signed out successfully." });

  // Expire the auth-token cookie immediately
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // expire immediately
  });

  return response;
}
