import pool from "@/lib/db";

export async function GET(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid order id." }, { status: 400 });
  }
  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [id]
    );
    if (orders.length === 0) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const [orderItems] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [id]
    );

    return Response.json({ ...orders[0], order_items: orderItems });
  } catch (error) {
    console.log("GET /api/orders/[id] error:", error);
    return Response.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) {
    return Response.json({ error: "Invalid order id." }, { status: 400 });
  }
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

    const [existing] = await conn.query(
      "SELECT 1 FROM orders WHERE order_id = ? LIMIT 1",
      [id]
    );
    if (existing.length === 0) {
      conn.release();
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    await conn.beginTransaction();

    // Refund stock from old order items before clearing them
    const [oldItems] = await conn.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    for (const oldItem of oldItems) {
      await conn.query(
        "UPDATE products SET quantity = quantity + ? WHERE product_id = ?",
        [oldItem.quantity, oldItem.product_id]
      );
    }

    // Update order master record
    await conn.query(
      `UPDATE orders SET client_name = ?, email = ?, phone = ?, shipping_address = ?, order_date = ?, status = ?, total_amount = ? WHERE order_id = ?`,
      [
        client_name.trim(),
        email.trim(),
        phone.trim(),
        shipping_address.trim(),
        mysqlDate,
        status.trim(),
        total_amount,
        id,
      ]
    );

    // Delete old order items
    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

    // Validate, deduct stock, insert new order items
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

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [id, item.product_id, item.quantity, item.price]
      );
    }

    await conn.commit();

    const [orderRows] = await conn.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [id]
    );
    const [itemsRows] = await conn.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [id]
    );

    conn.release();

    return Response.json({ ...orderRows[0], order_items: itemsRows });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.log("PUT /api/orders/[id] error:", error);
    return Response.json({ error: "Failed to update order." }, { status: 500 });
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

    // Delete order items first (foreign key or manual)
    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

    // Delete order
    const [result] = await conn.query(`DELETE FROM orders WHERE order_id = ?`, [
      id,
    ]);

    await conn.commit();
    conn.release();

    if (result.affectedRows === 0) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    return Response.json(
      { message: "Order and items deleted." },
      { status: 200 }
    );
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.log("DELETE /api/orders/[id] error:", error);
    return Response.json({ error: "Failed to delete order." }, { status: 500 });
  }
}
