// app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetches a single order with detailed variant information for each item
export async function GET(req, { params }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Join with product_variants and products to get full item details
    const [orderItems] = await pool.query(
      `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.variant_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        pv.sku,
        (
          SELECT GROUP_CONCAT(av.value SEPARATOR ', ')
          FROM variant_values vv
          JOIN attribute_values av ON vv.value_id = av.value_id
          WHERE vv.variant_id = oi.variant_id
        ) AS attributes
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
      LEFT JOIN products p ON pv.product_id = p.product_id
      WHERE oi.order_id = ?
      `,
      [id]
    );

    return NextResponse.json({ ...orders[0], order_items: orderItems });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order." },
      { status: 500 }
    );
  }
}

// PUT: Updates an order, correctly adjusting stock for product variants
export async function PUT(req, { params }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const body = await req.json();
    const {
      client_name,
      email,
      phone,
      shipping_address,
      order_date,
      status,
      total_amount,
      order_items, // Expects { variant_id, quantity, price }
    } = body;

    // ... (Your validation for body fields can remain here)

    // 1. Refund stock from old items using variant_id
    const [oldItems] = await conn.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );
    for (const oldItem of oldItems) {
      if (oldItem.variant_id) {
        await conn.query(
          "UPDATE product_variants SET quantity = quantity + ? WHERE variant_id = ?",
          [oldItem.quantity, oldItem.variant_id]
        );
      }
    }

    // 2. Update the main order details
    const mysqlDate = new Date(order_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    await conn.query(
      `UPDATE orders SET client_name = ?, email = ?, phone = ?, shipping_address = ?, order_date = ?, status = ?, total_amount = ? WHERE order_id = ?`,
      [
        client_name,
        email,
        phone,
        shipping_address,
        mysqlDate,
        status,
        total_amount,
        id,
      ]
    );

    // 3. Delete old order items
    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

    // 4. Deduct stock and insert new items using variant_id
    for (const item of order_items) {
      const [updateResult] = await conn.query(
        `UPDATE product_variants SET quantity = quantity - ? WHERE variant_id = ? AND quantity >= ?`,
        [item.quantity, item.variant_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(
          `Insufficient stock for variant ID ${item.variant_id}.`
        );
      }

      await conn.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [id, item.variant_id, item.quantity, item.price]
      );
    }

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Order updated successfully." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order." },
      { status: 500 }
    );
  }
}

// DELETE: Deletes an order and restores stock to the correct product variants
export async function DELETE(req, { params }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get items from the order to restore stock
    const [orderItems] = await conn.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    // 2. Restore stock for each variant
    for (const item of orderItems) {
      if (item.variant_id) {
        await conn.query(
          "UPDATE product_variants SET quantity = quantity + ? WHERE variant_id = ?",
          [item.quantity, item.variant_id]
        );
      }
    }

    // 3. Delete the order and its dependents (cascade or manual)
    await conn.query("DELETE FROM payments WHERE order_id = ?", [id]);
    await conn.query("DELETE FROM order_items WHERE order_id = ?", [id]);
    const [result] = await conn.query("DELETE FROM orders WHERE order_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Order not found.");
    }

    await conn.commit();
    conn.release();

    return NextResponse.json({
      message: "Order deleted and stock restored.",
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete order." },
      { status: 500 }
    );
  }
}
