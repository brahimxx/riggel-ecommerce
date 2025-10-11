// app/api/products/by-slug/[slug]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Optional: cache this product JSON for 5 minutes
export const revalidate = 300;

// GET /api/products/by-slug/[slug]
export async function GET(req, { params }) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Invalid product slug." },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch the base product, now including rating, total quantity, and a base price
    const [rows] = await pool.query(
      `SELECT 
         p.product_id, 
         p.name, 
         p.slug, 
         p.description, 
         p.category_id, 
         p.created_at,
         (
           SELECT AVG(r.rating)
           FROM reviews r
           WHERE r.product_id = p.product_id
         ) AS rating,
         (
           SELECT MIN(pv.price)
           FROM product_variants pv
           WHERE pv.product_id = p.product_id
         ) AS price,
         (
           SELECT SUM(pv.quantity)
           FROM product_variants pv
           WHERE pv.product_id = p.product_id
         ) AS total_quantity
       FROM 
         products p 
       WHERE 
         p.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = rows[0];

    // 2. Fetch all variants for this product
    const [variantsRaw] = await pool.query(
      `
      SELECT 
        pv.variant_id, 
        pv.sku, 
        pv.price, 
        pv.quantity,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('name', a.name, 'value', av.value)
          )
          FROM variant_values vv
          JOIN attribute_values av ON vv.value_id = av.value_id
          JOIN attributes a ON av.attribute_id = a.attribute_id
          WHERE vv.variant_id = pv.variant_id
        ) AS attributes
      FROM product_variants pv
      WHERE pv.product_id = ?
      `,
      [product.product_id]
    );

    const variants = variantsRaw.map((v) => ({
      ...v,
      attributes:
        typeof v.attributes === "string"
          ? JSON.parse(v.attributes)
          : v.attributes || [],
    }));

    // 3. Fetch all images
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [product.product_id]
    );

    // 4. Combine and return
    return NextResponse.json({ ...product, variants, images });
  } catch (error) {
    console.error("GET /api/products/by-slug/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
