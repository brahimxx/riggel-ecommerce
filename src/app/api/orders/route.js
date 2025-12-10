// app/api/orders/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/mail";

// GET: Returns a summary list of all orders
export async function GET(req) {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        COUNT(oi.order_item_id) AS item_count,
        COALESCE(SUM(oi.quantity), 0) AS total_variants_quantities
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `);
    return NextResponse.json(orders);
  } catch (error) {
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
      order_items,
      note,
    } = body;

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

    // ✅ EMAIL VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      conn.release();
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // ✅ PHONE VALIDATION (7-15 digits, optional + prefix)
    const phoneRegex = /^\+?\d{7,15}$/;
    if (phone && !phoneRegex.test(phone.trim().replace(/[\s\-()]/g, ""))) {
      conn.release();
      return NextResponse.json(
        { error: "Invalid phone number format. Must be 7-15 digits." },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    // 1. Insert the main order record with a UUID token
    const [orderRes] = await conn.query(
      `INSERT INTO orders (
         client_name,
         email,
         phone,
         shipping_address,
         order_date,
         status,
         total_amount,
         order_token,
         note  -- <--- Add column
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, UUID(), ?)`,
      [
        client_name.trim(),
        email.trim(),
        phone?.trim(),
        shipping_address.trim(),
        mysqlDate,
        status.trim(),
        total_amount,
        note?.trim() || null,
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
            error:
              "One or more items in your cart are out of stock. Please review your cart.",
          },
          { status: 409 }
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

    // 5. Fetch Order Data
    const [orderRows] = await conn.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [order_id]
    );

    // ✅ FIXED: Fetch Items with Product Name, Image, and Attributes
    const [itemsRows] = await conn.query(
      `SELECT 
         oi.order_item_id,
         oi.order_id,
         oi.variant_id,
         oi.quantity,
         oi.price,
         p.name AS product_name,
         
         -- Get the primary image URL (or first available) from product_images table
         (
            SELECT url 
            FROM product_images pi 
            WHERE pi.product_id = p.product_id 
            ORDER BY pi.is_primary DESC, pi.sort_order ASC 
            LIMIT 1
         ) AS product_image,

         -- Concatenate attributes (e.g. "Color: Red, Size: XL")
         GROUP_CONCAT(
            CONCAT(a.name, ': ', av.value) 
            SEPARATOR ', '
         ) AS attributes

       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.variant_id
       JOIN products p ON pv.product_id = p.product_id
       
       -- Join attributes chain to get "Color", "Size", etc.
       LEFT JOIN variant_values vv ON pv.variant_id = vv.variant_id
       LEFT JOIN attribute_values av ON vv.value_id = av.value_id
       LEFT JOIN attributes a ON av.attribute_id = a.attribute_id
       
       WHERE oi.order_id = ?
       GROUP BY oi.order_item_id`,
      [order_id]
    );

    conn.release();

    const order = orderRows[0];
    order.order_items = itemsRows;

    // Send confirmation email
    // This will now have correct product_name, product_image, and attributes!
    const emailResult = await sendOrderConfirmationEmail(order);
    if (!emailResult.success) {
      console.warn("Email failed but order saved:", emailResult.error);
    }

    return NextResponse.json(
      { ...order, order_items: itemsRows },
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
