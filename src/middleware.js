import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  // If trying to access public auth pages, let them through.
  if (["/login"].includes(pathname)) {
    return NextResponse.next();
  }

  // If no token and not on a public page, redirect to login.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the token and get the user's role from the payload.
    const { payload } = await jwtVerify(token, SECRET);
    const userRole = payload.role; // Assumes your JWT payload has a 'role' property

    // --- Role-Based Access Control ---

    // Example: Admins and Editors can access routes under /dashboard
    if (pathname.startsWith("/dashboard")) {
      if (!["admin", "editor"].includes(userRole)) {
        const forbiddenUrl = new URL("/forbidden", req.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // If all checks pass, allow the request to proceed.
    return NextResponse.next();
  } catch (error) {
    // If token verification fails (e.g., expired, invalid), redirect to login.
    console.error("JWT Verification Error:", error.message);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "session_expired");
    return NextResponse.redirect(loginUrl);
  }
}

// Config to specify which paths the middleware should run on.
export const config = {
  // Match all paths except for static files, API routes, and image optimization files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
