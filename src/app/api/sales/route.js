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

export async function GET(request) {
  try {
    const [sales] = await db.query("SELECT * FROM sales");
    // (Optional: for listing, you can aggregate assigned products for each sale here)
    return Response.json(sales, { status: 200 });
  } catch (e) {
    console.error("GET sales error:", e);
    return Response.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

// POST: Create sale with product assignments
export async function POST(request) {
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

    // Insert sale: get correct saleId!
    const [result] = await db.query(
      "INSERT INTO sales (name, discount_type, discount_value, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
      [name, discount_type, discount_value, startDateMySQL, endDateMySQL]
    );
    const saleId = result.insertId; // This assumes [result] contains the insertId!

    if (!saleId) {
      throw new Error("Sale ID not returned after insert!");
    }

    // Assign products
    if (Array.isArray(product_ids)) {
      for (const productId of product_ids) {
        await db.query(
          "INSERT INTO sale_product (sale_id, product_id) VALUES (?, ?)",
          [saleId, productId]
        );
      }
    }

    return Response.json({ message: "Sale created" }, { status: 201 });
  } catch (e) {
    console.error("POST sale error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
