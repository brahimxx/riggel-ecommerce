import { cache } from "react";
import ProductTabs from "@/components/ProductTabs/ProductTabs";
import ProductShowcase from "@/components/ProductShowcase";
import ProductReviewsTab from "@/components/ProductReviewsTab";
import YouMightAlsoLike from "@/components/YouMightAlsoLike";
import pool from "@/lib/db";
import { App } from "antd";

// Same env handling as layout
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// 1. Memoized product fetcher
const getProduct = cache(async (slug) => {
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
        (SELECT SUM(pv.quantity) FROM product_variants pv WHERE pv.product_id = p.product_id) AS total_variants_quantities
      FROM products p 
      WHERE p.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return null;
    }

    const product = rows[0];

    const [categories] = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?`,
      [product.product_id]
    );

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

    const [images] = await pool.query(
      `SELECT 
        pi.*,
        (SELECT JSON_ARRAYAGG(piv.variant_id) 
         FROM product_image_variants piv 
         WHERE piv.image_id = pi.id) as variant_ids
       FROM product_images pi 
       WHERE pi.product_id = ? 
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC`,
      [product.product_id]
    );

    const [saleRows] = await pool.query(
      `SELECT s.*
       FROM sale_product sp
       JOIN sales s ON sp.sale_id = s.id
       WHERE sp.product_id = ? AND s.start_date <= NOW() AND s.end_date >= NOW()
       ORDER BY s.id DESC
       LIMIT 1`,
      [product.product_id]
    );

    const sale = saleRows.length > 0 ? saleRows[0] : null;

    return { ...product, categories, variants, images, sale };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
});

// 2. Dynamic metadata per product
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  const primaryImage = product.images?.[0]?.url || "/riggel-og-1200x630.png";
  const imageUrl = primaryImage.startsWith("http")
    ? primaryImage
    : `${siteUrl}${primaryImage}`;

  const shortDescription =
    product.description?.substring(0, 160) ||
    `Buy ${product.name} at the best price on Riggel.`;

  return {
    title: product.name,
    description: shortDescription,
    openGraph: {
      title: product.name,
      description: shortDescription,
      url: `${siteUrl}/products/${product.slug}`,
      siteName: "Riggel",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

// 3. Reviews
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

// 4. Page component
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

  console.log(product);

  const tabs = ["", <ProductReviewsTab key="reviews" reviews={reviews} />, ""];

  return (
    <>
      <div className="flex flex-col max-w-screen-2xl mx-auto px-4 overflow-hidden">
        <App>
          <ProductShowcase product={product} />
        </App>
        <ProductTabs>{tabs}</ProductTabs>
      </div>
      <YouMightAlsoLike />
    </>
  );
}
