import pool from "@/lib/db";

export async function GET(req) {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        COUNT(oi.order_item_id) AS item_count,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `);
    return Response.json(orders);
  } catch (error) {
    return Response.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function POST(req) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const {
      client_name,
      email,
      phone,
      shipping_adresse,
      order_date,
      status,
      total_amount,
      order_items,
    } = body;

    // Basic validation
    if (
      typeof client_name !== "string" ||
      client_name.trim() === "" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof shipping_adresse !== "string" ||
      !order_date || // expects a valid ISO string or timestamp
      typeof status !== "string" ||
      typeof total_amount !== "number" ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      return Response.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    // Begin transaction
    await conn.beginTransaction();

    // Insert order
    const [orderRes] = await conn.query(
      `INSERT INTO orders (client_name, email, phone, shipping_adresse, order_date, status, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        client_name.trim(),
        email.trim(),
        phone.trim(),
        shipping_adresse.trim(),
        order_date,
        status.trim(),
        total_amount,
      ]
    );
    const order_id = orderRes.insertId;

    // Validate and insert order items
    for (let i = 0; i < order_items.length; i++) {
      const item = order_items[i];
      if (
        typeof item.product_id !== "number" ||
        typeof item.quantity !== "number" ||
        typeof item.price !== "number" ||
        item.quantity <= 0 ||
        item.price < 0
      ) {
        await conn.rollback();
        conn.release();
        return Response.json(
          { error: "Invalid order item detected." },
          { status: 400 }
        );
      }
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, item.price]
      );
    }

    await conn.commit();

    // Fetch newly created order with its items
    const [orderRows] = await conn.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [order_id]
    );
    const [itemsRows] = await conn.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order_id]
    );

    conn.release();

    return Response.json(
      { ...orderRows[0], order_items: itemsRows },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback();
    conn.release();
    return Response.json({ error: "Failed to create order." }, { status: 500 });
  }
}
