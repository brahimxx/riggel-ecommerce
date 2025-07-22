// app/api/inventory/route.js
import pool from "@/lib/db";

// GET: Get inventory for all products
export async function GET(req) {
  const [inventory] = await pool.query("SELECT * FROM inventory");
  return Response.json(inventory);
}

// PUT: Update inventory quantity for a product
export async function PUT(req) {
  const body = await req.json();
  const { product_id, stock_quantity } = body;

  await pool.query(
    `UPDATE inventory SET stock_quantity = ?, last_updated = NOW()
     WHERE product_id = ?`,
    [stock_quantity, product_id]
  );
  return Response.json({ updated: true });
}
