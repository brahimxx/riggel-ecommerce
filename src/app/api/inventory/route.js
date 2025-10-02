// app/api/inventory/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Get inventory for all product variants
export async function GET(req) {
  try {
    // This query joins variants with their parent products to provide a full inventory list.
    const [inventory] = await pool.query(
      `
      SELECT 
        pv.variant_id,
        pv.product_id,
        p.name AS product_name,
        pv.sku,
        (
          SELECT GROUP_CONCAT(av.value SEPARATOR ', ')
          FROM variant_values vv
          JOIN attribute_values av ON vv.value_id = av.value_id
          WHERE vv.variant_id = pv.variant_id
        ) AS attributes,
        pv.quantity AS stock_quantity
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.product_id
      ORDER BY p.name, pv.variant_id
      `
    );
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory." },
      { status: 500 }
    );
  }
}

// PUT: Update inventory quantity for a specific product variant
export async function PUT(req) {
  try {
    const body = await req.json();
    const { variant_id, stock_quantity } = body;

    // Validate input
    if (
      typeof variant_id !== "number" ||
      typeof stock_quantity !== "number" ||
      stock_quantity < 0
    ) {
      return NextResponse.json(
        { error: "Invalid or missing variant_id or stock_quantity." },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `UPDATE product_variants SET quantity = ? WHERE variant_id = ?`,
      [stock_quantity, variant_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Variant not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Inventory updated successfully.",
      variant_id: variant_id,
      new_quantity: stock_quantity,
    });
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory." },
      { status: 500 }
    );
  }
}
