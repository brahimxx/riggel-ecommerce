import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: All attributes and their possible values
export async function GET(req) {
  try {
    const [attributes] = await pool.query(
      "SELECT * FROM attributes ORDER BY name ASC"
    );
    const [allValues] = await pool.query(
      "SELECT * FROM attribute_values ORDER BY value ASC"
    );

    const attributesMap = attributes.map((attr) => ({
      ...attr,
      values: allValues.filter((v) => v.attribute_id === attr.attribute_id),
    }));

    return NextResponse.json(attributesMap);
  } catch (error) {
    console.error("GET /api/attributes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributes." },
      { status: 500 }
    );
  }
}

// POST: Create a new attribute
export async function POST(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, values } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const [attrRes] = await conn.query(
      "INSERT INTO attributes (name) VALUES (?)",
      [name.trim()]
    );
    const attribute_id = attrRes.insertId;

    if (Array.isArray(values) && values.length > 0) {
      const insertValues = values
        .filter((v) => v && v.trim())
        .map((v) => [attribute_id, v.trim()]);
      if (insertValues.length > 0) {
        await conn.query(
          "INSERT INTO attribute_values (attribute_id, value) VALUES ?",
          [insertValues]
        );
      }
    }

    await conn.commit();
    return NextResponse.json(
      { message: "Attribute created successfully.", attribute_id },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback();
    console.error("POST /api/attributes error:", error);
    return NextResponse.json(
      { error: "Failed to create attribute." },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
