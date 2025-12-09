import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, context) {
  const { id: attribute_id } = await context.params; // ✅ await

  try {
    if (!attribute_id) {
      return NextResponse.json(
        { error: "Attribute ID is required." },
        { status: 400 }
      );
    }

    const [attributes] = await pool.query(
      `SELECT a.*, GROUP_CONCAT(av.value SEPARATOR ',') as values 
       FROM attributes a 
       LEFT JOIN attribute_values av ON a.attribute_id = av.attribute_id 
       WHERE a.attribute_id = ? 
       GROUP BY a.attribute_id`,
      [attribute_id]
    );

    if (attributes.length === 0) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attributes[0]);
  } catch (error) {
    console.error("GET /api/attributes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attribute" },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  const { id: attribute_id } = await context.params; // ✅ await
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const { name, values: newValues } = await req.json();

    if (!attribute_id) {
      return NextResponse.json(
        { error: "Attribute ID is required." },
        { status: 400 }
      );
    }

    if (name !== undefined && name !== null && name.trim()) {
      await conn.query(
        "UPDATE attributes SET name = ? WHERE attribute_id = ?",
        [name.trim(), attribute_id]
      );
    }

    if (
      typeof newValues !== "undefined" &&
      Array.isArray(newValues) &&
      newValues.length > 0
    ) {
      const [currentValueRows] = await conn.query(
        "SELECT value_id, value FROM attribute_values WHERE attribute_id = ?",
        [attribute_id]
      );
      const currentValues = currentValueRows.map((row) => row.value);

      const valuesToAdd = newValues.filter(
        (nv) => nv && !currentValues.includes(nv.trim())
      );
      const valuesToCheckForDeletion = currentValueRows.filter(
        (row) => !newValues.some((nv) => nv.trim() === row.value)
      );

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
    console.error("PUT /api/attributes/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update attribute." },
      { status: error.message.includes("in use") ? 409 : 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(req, context) {
  const { id: attribute_id } = await context.params; // ✅ await

  if (!attribute_id) {
    return NextResponse.json(
      { error: "Attribute ID is required." },
      { status: 400 }
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

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
    console.error("DELETE /api/attributes/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete attribute." },
      { status: error.message.includes("in use") ? 409 : 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
