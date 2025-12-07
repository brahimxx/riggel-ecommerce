import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Helper to determine if an API route is public.
 * Now handles trailing slashes and method checks more robustly.
 */
function isPublicApiRoute(pathname, method) {
  const path =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  // --- 1. Authentication & Users ---
  if (path === "/api/auth/login" && method === "POST") return true;
  if (path === "/api/users" && method === "POST") return true;

  // --- 2. Orders (The Logical Fix) ---

  // ✅ Allow Guest Checkout (POST)
  if (path === "/api/orders" && method === "POST") return true;

  // ✅ Allow Guest Tracking (GET Detail)
  // Logic: Allow /api/orders/xyz, but BLOCK /api/orders (the list)
  if (path.startsWith("/api/orders/") && method === "GET") {
    return true;
  }
  // Note: We removed 'path === "/api/orders"' for GET.
  // Now, GET /api/orders requires a login (to see "My History").

  // --- 3. Products ---
  if (method === "GET") {
    if (path === "/api/products") return true;
    if (path.startsWith("/api/products/by-id/")) return true;
  }

  // --- 4. Sales/Attributes/Categories ---
  if (method === "GET") {
    const publicListRoutes = [
      "/api/attributes",
      "/api/categories",
      "/api/sales", // ✅ Correct: Sales (Discounts) are public
    ];
    if (publicListRoutes.includes(path)) return true;
  }

  return false;
}

// ⚠️ UPDATE: Function renamed from 'middleware' to 'proxy'
export async function proxy(req) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;
  const method = req.method;

  // --- 0. Allow Preflight (CORS) Requests ---
  if (method === "OPTIONS") {
    return NextResponse.next();
  }

  // --- 1. Public Access Check ---

  // Allow Pages: Login
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Allow API: Check specific public rules
  if (pathname.startsWith("/api") && isPublicApiRoute(pathname, method)) {
    return NextResponse.next();
  }

  // --- 2. Authentication Verification ---

  if (!token) {
    // Hybrid Response: JSON for API, Redirect for UI
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized: Login required" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userRole = payload.role;

    // --- 3. Role-Based Access Control ---
    if (pathname.startsWith("/dashboard")) {
      if (!["admin", "editor"].includes(userRole)) {
        return NextResponse.redirect(new URL("/forbidden", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "session_expired");
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
