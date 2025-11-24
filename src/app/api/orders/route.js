// app/api/orders/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Returns a summary list of all orders
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
    return NextResponse.json(orders);
  } catch (error) {
    console.log("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}

// POST: Creates a new order using product variants
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
      order_items, // Expected to contain { variant_id, quantity, price }
    } = body;

    console.log(body);

    const parsedDate = new Date(order_date);
    if (isNaN(parsedDate.getTime())) {
      conn.release();
      return NextResponse.json(
        { error: "Invalid order_date format" },
        { status: 400 }
      );
    }
    const mysqlDate = parsedDate.toISOString().slice(0, 19).replace("T", " ");

    // Basic validation
    if (
      !client_name?.trim() ||
      !email?.trim() ||
      !shipping_address?.trim() ||
      !order_date ||
      !status?.trim() ||
      typeof total_amount !== "number" ||
      !Array.isArray(order_items) ||
      order_items.length === 0
    ) {
      conn.release();
      return NextResponse.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    // 1. Insert the main order record
    const [orderRes] = await conn.query(
      `INSERT INTO orders (client_name, email, phone, shipping_address, order_date, status, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        client_name.trim(),
        email.trim(),
        phone?.trim(),
        shipping_address.trim(),
        mysqlDate,
        status.trim(),
        total_amount,
      ]
    );
    const order_id = orderRes.insertId;

    // 2. Process each order item, checking variant stock
    for (const item of order_items) {
      if (
        typeof item.variant_id !== "number" ||
        typeof item.quantity !== "number" ||
        typeof item.price !== "number" ||
        item.quantity <= 0
      ) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          { error: "Invalid order item detected." },
          { status: 400 }
        );
      }

      // 3. Atomically deduct stock from the product_variants table
      const [updateResult] = await conn.query(
        `UPDATE product_variants 
         SET quantity = quantity - ? 
         WHERE variant_id = ? AND quantity >= ?`,
        [item.quantity, item.variant_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          {
            error: `Insufficient stock for variant ID ${item.variant_id}.`,
          },
          { status: 409 } // 409 Conflict is suitable for stock issues
        );
      }

      // 4. Insert the order item with the variant_id
      await conn.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.variant_id, item.quantity, item.price]
      );
    }

    await conn.commit();

    // 5. Return the newly created order with its items
    const [orderRows] = await conn.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [order_id]
    );
    const [itemsRows] = await conn.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order_id]
    );

    conn.release();

    return NextResponse.json(
      { ...orderRows[0], order_items: itemsRows },
      { status: 201 }
    );
  } catch (error) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 }
    );
  }
}
