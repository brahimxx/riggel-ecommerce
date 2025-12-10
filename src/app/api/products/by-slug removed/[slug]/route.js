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
    // 1. Fetch the base product with all metrics
    const [rows] = await pool.query(
      `SELECT 
        p.product_id, 
        p.name, 
        p.slug, 
        p.description, 
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
        ) AS total_variants_quantities,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN product_variants pv ON oi.variant_id = pv.variant_id
          WHERE pv.product_id = p.product_id
        ), 0) AS total_orders
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

    // 2. Fetch all categories for this product (many-to-many)
    const [categories] = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [product.product_id]
    );

    // 3. Fetch all variants with attributes
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

    // 4. Fetch all images with enhanced security fields & Many-to-Many Variant IDs
    // UPDATED: Now fetches array of variant_ids for each image
    const [images] = await pool.query(
      `SELECT 
        pi.id, 
        pi.product_id, 
        pi.url, 
        pi.filename, 
        pi.original_filename, 
        pi.alt_text, 
        pi.sort_order, 
        pi.is_primary, 
        pi.mime_type,
        (SELECT JSON_ARRAYAGG(piv.variant_id) 
         FROM product_image_variants piv 
         WHERE piv.image_id = pi.id) as variant_ids
      FROM product_images pi 
      WHERE pi.product_id = ? 
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC`,
      [product.product_id]
    );

    // 5. Fetch active sale information
    const [saleInfo] = await pool.query(
      `SELECT 
        s.id AS sale_id,
        s.name AS sale_name,
        s.discount_type,
        s.discount_value
      FROM sales s
      JOIN sale_product sp ON s.id = sp.sale_id
      WHERE sp.product_id = ?
        AND s.start_date <= NOW() 
        AND s.end_date >= NOW()
      LIMIT 1`,
      [product.product_id]
    );

    // 6. Combine and return with sale info
    return NextResponse.json({
      ...product,
      categories,
      variants,
      images,
      // Add sale info if exists
      sale_id: saleInfo.length > 0 ? saleInfo[0].sale_id : null,
      sale_name: saleInfo.length > 0 ? saleInfo[0].sale_name : null,
      discount_type: saleInfo.length > 0 ? saleInfo[0].discount_type : null,
      discount_value: saleInfo.length > 0 ? saleInfo[0].discount_value : null,
    });
  } catch (error) {
    console.error("GET /api/products/by-slug/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
