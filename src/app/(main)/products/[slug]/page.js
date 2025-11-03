// src/app/products/[slug]/page.js
import ProductTabs from "@/components/ProductTabs/ProductTabs";
import ProductShowcase from "@/components/ProductShowcase";
import ProductReviewsTab from "@/components/ProductReviewsTab";
import YouMightAlsoLike from "@/components/YouMightAlsoLike";
import pool from "@/lib/db";

// SERVER COMPONENT: fetch product directly from database
async function getProduct(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
        p.product_id, 
        p.name, 
        p.slug, 
        p.description, 
        p.created_at,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.product_id) AS rating,
        (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.product_id) AS price,
        (SELECT SUM(pv.quantity) FROM product_variants pv WHERE pv.product_id = p.product_id) AS total_quantity
      FROM products p 
      WHERE p.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return null;
    }

    const product = rows[0];

    // Fetch categories
    const [categories] = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [product.product_id]
    );

    // Fetch variants
    const [variantsRaw] = await pool.query(
      `SELECT 
        pv.variant_id, 
        pv.sku, 
        pv.price, 
        pv.quantity,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('name', a.name, 'value', av.value))
          FROM variant_values vv
          JOIN attribute_values av ON vv.value_id = av.value_id
          JOIN attributes a ON av.attribute_id = a.attribute_id
          WHERE vv.variant_id = pv.variant_id
        ) AS attributes
      FROM product_variants pv
      WHERE pv.product_id = ?`,
      [product.product_id]
    );

    const variants = variantsRaw.map((v) => ({
      ...v,
      attributes:
        typeof v.attributes === "string"
          ? JSON.parse(v.attributes)
          : v.attributes || [],
    }));

    // Fetch images
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [product.product_id]
    );

    return { ...product, categories, variants, images };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Fetch reviews directly from database
async function getReviews(productId) {
  try {
    const [reviews] = await pool.query(
      `SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC`,
      [productId]
    );
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product;
  let reviews = [];

  try {
    product = await getProduct(slug);
  } catch (e) {
    console.error("Error fetching product:", e);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-gray-500">
          Sorry, the product you're looking for does not exist.
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-gray-500">
          Sorry, the product you're looking for does not exist.
        </p>
      </div>
    );
  }

  try {
    if (product?.product_id) {
      reviews = await getReviews(product.product_id);
    }
  } catch (e) {
    console.error("Error fetching reviews:", e);
  }

  const tabs = ["", <ProductReviewsTab key="reviews" reviews={reviews} />, ""];

  return (
    <div className="flex flex-col max-w-screen-2xl mx-auto px-4 overflow-hidden">
      <ProductShowcase product={product} />
      <ProductTabs>{tabs}</ProductTabs>
      <YouMightAlsoLike />
    </div>
  );
}
