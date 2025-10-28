import { NextResponse } from "next/server"; // Use NextResponse
import pool from "@/lib/db";

// GET: All attributes and their possible values (More efficient query)
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

// PUT: Safely update attribute name and/or values
export async function PUT(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { attribute_id, name, values: newValues } = await req.json();

    if (!attribute_id) {
      return NextResponse.json(
        { error: "Attribute ID is required." },
        { status: 400 }
      );
    }

    // 1. Update the attribute name if provided
    if (name && name.trim()) {
      await conn.query(
        "UPDATE attributes SET name = ? WHERE attribute_id = ?",
        [name.trim(), attribute_id]
      );
    }

    // 2. Safely synchronize the attribute values if provided
    if (Array.isArray(newValues)) {
      const [currentValueRows] = await conn.query(
        "SELECT value_id, value FROM attribute_values WHERE attribute_id = ?",
        [attribute_id]
      );
      const currentValues = currentValueRows.map((row) => row.value);

      const valuesToAdd = newValues.filter(
        (nv) => nv && !currentValues.includes(nv.trim())
      );
      const valuesToCheckForDeletion = currentValueRows.filter(
        (row) => !newValues.includes(row.value)
      );

      // Add new values
      if (valuesToAdd.length > 0) {
        const insertData = valuesToAdd.map((value) => [
          attribute_id,
          value.trim(),
        ]);
        await conn.query(
          "INSERT INTO attribute_values (attribute_id, value) VALUES ?",
          [insertData]
        );
      }

      // Safely delete old, unused values
      for (const valToDelete of valuesToCheckForDeletion) {
        const [usage] = await conn.query(
          "SELECT 1 FROM variant_values WHERE value_id = ? LIMIT 1",
          [valToDelete.value_id]
        );
        if (usage.length > 0) {
          throw new Error(
            `Cannot remove value "${valToDelete.value}" because it is in use by products.`
          );
        }
        await conn.query("DELETE FROM attribute_values WHERE value_id = ?", [
          valToDelete.value_id,
        ]);
      }
    }

    await conn.commit();
    return NextResponse.json({ message: "Attribute updated successfully." });
  } catch (error) {
    await conn.rollback();
    console.error("PUT /api/attributes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update attribute." },
      { status: error.message.includes("in use") ? 409 : 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

// DELETE: Safely delete an attribute
export async function DELETE(req) {
  // This handler should use query params, not a request body.
  const { searchParams } = new URL(req.url);
  const attribute_id = searchParams.get("id");

  if (!attribute_id) {
    return NextResponse.json(
      { error: "Attribute ID is required." },
      { status: 400 }
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if any of the attribute's values are in use
    const [usage] = await conn.query(
      `SELECT 1 FROM variant_values vv
             JOIN attribute_values av ON vv.value_id = av.value_id
             WHERE av.attribute_id = ? LIMIT 1`,
      [attribute_id]
    );

    if (usage.length > 0) {
      throw new Error(
        "Cannot delete attribute because its values are in use by products."
      );
    }

    // If not in use, proceed with deletion
    await conn.query("DELETE FROM attribute_values WHERE attribute_id = ?", [
      attribute_id,
    ]);
    await conn.query("DELETE FROM attributes WHERE attribute_id = ?", [
      attribute_id,
    ]);

    await conn.commit();
    return NextResponse.json({ message: "Attribute deleted successfully." });
  } catch (error) {
    await conn.rollback();
    console.error("DELETE /api/attributes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete attribute." },
      { status: error.message.includes("in use") ? 409 : 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
