import pool from "@/lib/db";

export async function GET(req) {
  const [orders] = await pool.query("SELECT * FROM orders");
  return Response.json(orders);
}

export async function POST(req) {
  const body = await req.json();
  const {
    client_name,
    email,
    phone,
    shipping_address,
    order_items,
    total_amount,
    status,
  } = body;

  // Insert main order
  const [result] = await pool.query(
    `INSERT INTO orders (client_name, email, phone, shipping_address, total_amount, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      client_name,
      email,
      phone,
      shipping_address,
      total_amount,
      status || "Pending",
    ]
  );

  const orderId = result.insertId;

  // Insert order items
  for (const item of order_items) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES (?, ?, ?, ?)`,
      [orderId, item.product_id, item.quantity, item.price]
    );
  }

  return Response.json({ orderId }, { status: 201 });
}
