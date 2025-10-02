// POST: Create a new attribute
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, values } = body;
    if (!name)
      return Response.json({ error: "Name required." }, { status: 400 });
    const [attrRes] = await pool.query(
      "INSERT INTO attributes (name) VALUES (?)",
      [name]
    );
    const attribute_id = attrRes.insertId;
    if (Array.isArray(values)) {
      for (const value of values) {
        await pool.query(
          "INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)",
          [attribute_id, value]
        );
      }
    }
    return Response.json({ message: "Attribute created.", attribute_id });
  } catch (error) {
    return Response.json(
      { error: "Failed to create attribute." },
      { status: 500 }
    );
  }
}

// PUT: Update attribute name or values
export async function PUT(req) {
  try {
    const body = await req.json();
    const { attribute_id, name, values } = body;
    if (!attribute_id)
      return Response.json(
        { error: "attribute_id required." },
        { status: 400 }
      );
    if (name) {
      await pool.query(
        "UPDATE attributes SET name = ? WHERE attribute_id = ?",
        [name, attribute_id]
      );
    }
    if (Array.isArray(values)) {
      // Remove old values, add new ones
      await pool.query("DELETE FROM attribute_values WHERE attribute_id = ?", [
        attribute_id,
      ]);
      for (const value of values) {
        await pool.query(
          "INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)",
          [attribute_id, value]
        );
      }
    }
    return Response.json({ message: "Attribute updated." });
  } catch (error) {
    return Response.json(
      { error: "Failed to update attribute." },
      { status: 500 }
    );
  }
}

// DELETE: Remove attribute and its values
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { attribute_id } = body;
    if (!attribute_id)
      return Response.json(
        { error: "attribute_id required." },
        { status: 400 }
      );
    await pool.query("DELETE FROM attribute_values WHERE attribute_id = ?", [
      attribute_id,
    ]);
    await pool.query("DELETE FROM attributes WHERE attribute_id = ?", [
      attribute_id,
    ]);
    return Response.json({ message: "Attribute deleted." });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete attribute." },
      { status: 500 }
    );
  }
}
import pool from "@/lib/db";

// GET: All attributes and their possible values
export async function GET(req) {
  try {
    // Get all attributes
    const [attributes] = await pool.query(
      `SELECT * FROM attributes ORDER BY name ASC`
    );
    // For each attribute, get its values
    for (const attr of attributes) {
      const [values] = await pool.query(
        `SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY value ASC`,
        [attr.attribute_id]
      );
      attr.values = values;
    }
    return Response.json(attributes);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch attributes." },
      { status: 500 }
    );
  }
}
