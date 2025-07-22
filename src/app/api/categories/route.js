import pool from "@/lib/db";

export async function GET(req) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("category_id");

  let query = "SELECT * FROM categories";
  let params = [];
  if (categoryId) {
    query += " WHERE category_id = ?";
    params.push(categoryId);
  }

  const [categories] = await pool.query(query, params);
  return Response.json(categories);
}
