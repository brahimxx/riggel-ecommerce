import db from "@/lib/db";

// Helper: Format ISO timestamp string to MySQL DATETIME
const formatMySQLDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
};

// GET: Fetch a sale and its assigned products
export async function GET(request, context) {
  const { id } = await context.params;
  try {
    const [sales] = await db.query("SELECT * FROM sales WHERE id = ?", [id]);
    if (sales.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    // Get assigned products
    const [assigned] = await db.query(
      "SELECT product_id FROM sale_product WHERE sale_id = ?",
      [id]
    );
    const product_ids = assigned.map((row) => row.product_id);
    const sale = { ...sales[0], product_ids };
    return Response.json(sale, { status: 200 });
  } catch (e) {
    console.error("GET sale error:", e);
    return Response.json({ error: "Failed to fetch sale" }, { status: 500 });
  }
}

// PUT: Update sale and product assignments
export async function PUT(request, context) {
  const { id } = await context.params;
  try {
    const {
      name,
      discount_type,
      discount_value,
      start_date,
      end_date,
      product_ids = [],
    } = await request.json();

    const startDateMySQL = formatMySQLDate(start_date);
    const endDateMySQL = formatMySQLDate(end_date);

    // Update sale info
    await db.query(
      "UPDATE sales SET name=?, discount_type=?, discount_value=?, start_date=?, end_date=? WHERE id=?",
      [name, discount_type, discount_value, startDateMySQL, endDateMySQL, id]
    );

    // Update product assignments
    await db.query("DELETE FROM sale_product WHERE sale_id = ?", [id]);
    if (Array.isArray(product_ids)) {
      for (const productId of product_ids) {
        await db.query(
          "INSERT INTO sale_product (sale_id, product_id) VALUES (?, ?)",
          [id, productId]
        );
      }
    }

    return Response.json({ message: "Sale updated" }, { status: 200 });
  } catch (e) {
    console.error("PUT sale error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove a sale and its product assignments
export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    await db.query("DELETE FROM sale_product WHERE sale_id = ?", [id]);
    await db.query("DELETE FROM sales WHERE id=?", [id]);
    return Response.json({ message: "Sale deleted" }, { status: 200 });
  } catch (e) {
    console.error("DELETE sale error:", e);
    return Response.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}
