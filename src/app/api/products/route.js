// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import slugify from "slugify";

// Cache JSON for 5 minutes (ISR for the route)
export const revalidate = 300;

// -- GET: All products (optional filters)
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

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [products] = await pool.query(
      `
      SELECT p.product_id, p.name, p.slug, p.description, p.price, p.category_id,
             p.created_at, p.quantity, p.rating,
             (
               SELECT url
               FROM product_images pi
               WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE
               LIMIT 1
             ) AS main_image
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      `,
      values
    );
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// -- POST: Create new product
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, price, category_id, quantity, images, rating } =
      body;

    // Basic validation
    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof price !== "number" ||
      !category_id ||
      typeof quantity !== "number" ||
      quantity < 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    const safeRating = typeof rating === "number" ? rating : 0;
    if (safeRating < 0 || safeRating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5." },
        { status: 400 }
      );
    }

    // 1) Insert product without slug first to get the id
    const [prodRes] = await pool.query(
      `
      INSERT INTO products (name, description, price, category_id, quantity, rating)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name, description, price, category_id, quantity, safeRating]
    );
    const product_id = prodRes.insertId;

    // 2) Build slug with id prefix: "123-nike-air-max-90"
    const base = slugify(name, { lower: true, strict: true });
    const slug = `${product_id}-${base}`;

    // 3) Save slug
    await pool.query(`UPDATE products SET slug = ? WHERE product_id = ?`, [
      slug,
      product_id,
    ]);

    // 4) Insert images (if any)
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await pool.query(
          `
          INSERT INTO product_images
            (product_id, url, alt_text, sort_order, is_primary)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            product_id,
            img.url,
            img.alt_text || "",
            img.sort_order ?? i,
            img.is_primary === true || i === 0,
          ]
        );
      }
    }

    // 5) Return created product with images
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [product_id]
    );
    const [imgs] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ?`,
      [product_id]
    );

    return NextResponse.json({ ...rows[0], images: imgs }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
