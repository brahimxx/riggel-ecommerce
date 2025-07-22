import pool from "@/lib/db";

export async function GET(req) {
  const [products] = await pool.query(
    `SELECT p.*, 
      (
        SELECT url 
        FROM product_images pi 
        WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE
        LIMIT 1
      ) AS main_image
    FROM products p`
  );
  return Response.json(products);
}

export async function POST(req) {
  const body = await req.json();
  const { name, description, price, category_id } = body;

  const [result] = await pool.query(
    `INSERT INTO products (name, description, price, category_id)
     VALUES (?, ?, ?, ?)`,
    [name, description, price, category_id]
  );

  return Response.json({ insertedId: result.insertId }, { status: 201 });
}
