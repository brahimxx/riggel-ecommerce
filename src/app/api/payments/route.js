// app/api/payments/route.js
import pool from "@/lib/db";

// GET: Retrieve all payments
export async function GET(req) {
  const [payments] = await pool.query("SELECT * FROM payments");
  return Response.json(payments);
}

// POST: Record a new payment
export async function POST(req) {
  const body = await req.json();
  const { order_id, amount, method, status } = body;

  const [result] = await pool.query(
    `INSERT INTO payments (order_id, amount, method, status)
     VALUES (?, ?, ?, ?)`,
    [order_id, amount, method, status || "Pending"]
  );
  return Response.json({ paymentId: result.insertId }, { status: 201 });
}
