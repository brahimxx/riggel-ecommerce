// app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Fetches a single order with detailed variant information for each item
// Supports BOTH:
// - /api/orders/123          -> by order_id (number)
// - /api/orders/<uuid-token> -> by order_token (string)
export async function GET(req, { params }) {
  const { id } = await params; // ✅ await params
  const identifier = id;

  if (!identifier) {
    return NextResponse.json(
      { error: "Invalid order identifier." },
      { status: 400 }
    );
  }

  try {
    // Decide whether identifier is numeric (order_id) or token (order_token)
    const numericId = Number(identifier);
    let whereClause;
    let whereValue;

    if (!Number.isNaN(numericId) && numericId > 0) {
      // Admin / internal usage: /api/orders/123
      whereClause = "order_id = ?";
      whereValue = numericId;
    } else {
      // Public token usage: /api/orders/<uuid>
      whereClause = "order_token = ?";
      whereValue = identifier;
    }

    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE ${whereClause}`,
      [whereValue]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = orders[0];
    const orderId = order.order_id;

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
        (
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_id = p.product_id
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS product_image,
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
      [orderId]
    );

    return NextResponse.json({ ...order, order_items: orderItems });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order." },
      { status: 500 }
    );
  }
}

// PUT: Updates an order, correctly adjusting stock for product variants
// Here we keep it strictly numeric (admin only)
export async function PUT(req, { params }) {
  const { id } = await params; // ✅ await params
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
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

    // 1. Refund stock from old items using variant_id
    const [oldItems] = await conn.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
      [numericId]
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
      `UPDATE orders 
       SET client_name = ?, email = ?, phone = ?, shipping_address = ?, 
           order_date = ?, status = ?, total_amount = ?
       WHERE order_id = ?`,
      [
        client_name,
        email,
        phone,
        shipping_address,
        mysqlDate,
        status,
        total_amount,
        numericId,
      ]
    );

    // 3. Delete old order items
    await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [numericId]);

    // 4. Deduct stock and insert new items using variant_id
    for (const item of order_items) {
      const [updateResult] = await conn.query(
        `UPDATE product_variants 
         SET quantity = quantity - ? 
         WHERE variant_id = ? AND quantity >= ?`,
        [item.quantity, item.variant_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(
          `Insufficient stock for variant ID ${item.variant_id}.`
        );
      }

      await conn.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [numericId, item.variant_id, item.quantity, item.price]
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
// Also kept numeric-only (admin operation)
export async function DELETE(req, { params }) {
  const { id } = await params; // ✅ await params
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get items from the order to restore stock
    const [orderItems] = await conn.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
      [numericId]
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
    await conn.query("DELETE FROM order_items WHERE order_id = ?", [numericId]);
    const [result] = await conn.query("DELETE FROM orders WHERE order_id = ?", [
      numericId,
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
