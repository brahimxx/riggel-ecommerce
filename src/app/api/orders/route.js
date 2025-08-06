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
    console.log("GET /api/orders error:", error);
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
      shipping_address,
      order_date,
      status,
      total_amount,
      order_items,
    } = body;

    const parsedDate = new Date(order_date);
    if (isNaN(parsedDate.getTime())) {
      conn.release();
      return Response.json(
        { error: "Invalid order_date format" },
        { status: 400 }
      );
    }
    const mysqlDate = parsedDate.toISOString().slice(0, 19).replace("T", " ");

    // Basic validation
    if (
      typeof client_name !== "string" ||
      client_name.trim() === "" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof shipping_address !== "string" ||
      !order_date ||
      typeof status !== "string" ||
      typeof total_amount !== "number" ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      conn.release();
      return Response.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    // Insert order master record
    const [orderRes] = await conn.query(
      `INSERT INTO orders (client_name, email, phone, shipping_address, order_date, status, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        client_name.trim(),
        email.trim(),
        phone.trim(),
        shipping_address.trim(),
        mysqlDate,
        status.trim(),
        total_amount,
      ]
    );
    const order_id = orderRes.insertId;

    // Validate, check stock, and insert order items
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

      // Deduct stock atomically only if enough stock available
      const [updateResult] = await conn.query(
        `UPDATE products 
         SET quantity = quantity - ? 
         WHERE product_id = ? AND quantity >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );
      if (updateResult.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return Response.json(
          {
            error: `Insufficient stock for product ID ${item.product_id}. Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      // Insert order item
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, item.price]
      );
    }

    await conn.commit();

    // Fetch newly created order with items
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
    console.log("POST /api/orders error:", error);
    return Response.json({ error: "Failed to create order." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid order id." }, { status: 400 });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch existing order items to restore stock
    const [orderItems] = await conn.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    // Restore stock for each item
    for (const item of orderItems) {
      await conn.query(
        "UPDATE products SET quantity = quantity + ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );
    }

    // Delete order items
    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

    // Delete order itself
    const [result] = await conn.query(`DELETE FROM orders WHERE order_id = ?`, [
      id,
    ]);

    await conn.commit();
    conn.release();

    if (result.affectedRows === 0) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    return Response.json(
      { message: "Order and items deleted and stock restored." },
      { status: 200 }
    );
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.log("DELETE /api/orders error:", error);
    return Response.json({ error: "Failed to delete order." }, { status: 500 });
  }
}
