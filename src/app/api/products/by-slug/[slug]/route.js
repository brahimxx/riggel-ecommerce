// app/api/products/by-slug/[slug]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Optional: cache this product JSON for 5 minutes
export const revalidate = 300;

// GET /api/products/by-slug/[slug]
export async function GET(req, { params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  if (!slug) {
    return NextResponse.json(
      { error: "Invalid product slug." },
      { status: 400 }
    );
  }
  try {
    // Fetch product by slug
    const [rows] = await pool.query(
      `SELECT product_id, name, slug, description, price, category_id, created_at, quantity, rating
       FROM products WHERE slug = ?`,
      [slug]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = rows[0];

    // Fetch all images with consistent order
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [product.product_id]
    );

    return NextResponse.json({ ...product, images });
  } catch (error) {
    console.error("GET /api/products/by-slug/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
