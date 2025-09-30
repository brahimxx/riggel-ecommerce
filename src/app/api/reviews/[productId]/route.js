import pool from "@/lib/db";

export async function GET(req, { params }) {
  const { productId } = params;

  if (!productId) {
    return Response.json({ error: "Missing product id" }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT review_id, client_name, rating, comment, date FROM reviews WHERE product_id = ?",
      [productId]
    );
    return Response.json(rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
