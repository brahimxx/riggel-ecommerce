import pool from "@/lib/db";

// -- GET: All products (optionally with filters)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");
  const minPrice = searchParams.get("price_min");
  const maxPrice = searchParams.get("price_max");
  const filters = [];
  const values = [];

  if (categoryId) {
    filters.push("p.category_id = ?");
    values.push(categoryId);
  }
  if (minPrice) {
    filters.push("p.price >= ?");
    values.push(minPrice);
  }
  if (maxPrice) {
    filters.push("p.price <= ?");
    values.push(maxPrice);
  }
  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const [products] = await pool.query(
      `SELECT p.*, (
          SELECT url
          FROM product_images pi
          WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS main_image
       FROM products p
       ${whereClause}
      `,
      values
    );
    return Response.json(products);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// -- POST: Create new product
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, price, category_id, quantity, images } = body;

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof price !== "number" ||
      !category_id ||
      typeof quantity !== "number" ||
      quantity < 0
    ) {
      return Response.json(
        { error: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    // Insert product
    const [prodRes] = await pool.query(
      `INSERT INTO products (name, description, price, category_id, quantity)
   VALUES (?, ?, ?, ?, ?)`,
      [name, description, price, category_id, quantity]
    );
    const product_id = prodRes.insertId;

    // Insert images (if any)
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await pool.query(
          `INSERT INTO product_images
              (product_id, url, alt_text, sort_order, is_primary)
           VALUES (?, ?, ?, ?, ?)`,
          [
            product_id,
            img.url, // Your frontend must provide this!
            img.alt_text || "",
            img.sort_order ?? i,
            img.is_primary === true || i === 0, // Set the first as primary (or supply explicitly)
          ]
        );
      }
    }

    // Return the product plus images
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_id = ?`,
      [product_id]
    );
    const [imgs] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ?`,
      [product_id]
    );
    return Response.json({ ...rows[0], images: imgs }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
