import ProductCard from "./ProductCard";
import pool from "@/lib/db";
import MyCarousel from "./MyCarousel";
import Link from "next/link";

// Revalidate this component every 5 minutes
export const revalidate = 300;

// MODIFICATION: Configurable fetch limit
const FETCH_LIMIT = 8; // Change this number to fetch more or fewer products

export async function getNewArrivals() {
  const [rows] = await pool.query(
    `SELECT
        p.product_id,
        p.name,
        p.slug,
        p.description,
        p.created_at,
        (
          SELECT AVG(r.rating)
          FROM reviews r
          WHERE r.product_id = p.product_id
        ) AS rating,
        (
          SELECT MIN(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) AS price,
        (
          SELECT SUM(pv.quantity)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) AS quantity,
        (
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_id = p.product_id
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS main_image,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('category_id', c.category_id, 'name', c.name)
          )
          FROM product_categories pc
          JOIN categories c ON pc.category_id = c.category_id
          WHERE pc.product_id = p.product_id
        ) AS categories,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'variant_id', variant_id,
              'sku', sku,
              'price', price,
              'quantity', quantity,
              'attributes', attributes
            )
          )
          FROM (
            SELECT
              pv2.variant_id,
              pv2.sku,
              pv2.price,
              pv2.quantity,
              (
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('name', a.name, 'value', av.value)
                )
                FROM variant_values vv
                JOIN attribute_values av ON vv.value_id = av.value_id
                JOIN attributes a ON av.attribute_id = a.attribute_id
                WHERE vv.variant_id = pv2.variant_id
              ) AS attributes
            FROM product_variants pv2
            WHERE pv2.product_id = p.product_id
          ) AS variant_list
        ) AS variants
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT ?;`,
    [FETCH_LIMIT]
  );

  // Parse all the nested JSON fields
  return rows.map((product) => ({
    ...product,
    categories:
      typeof product.categories === "string"
        ? JSON.parse(product.categories)
        : product.categories || [],
    variants:
      typeof product.variants === "string"
        ? JSON.parse(product.variants)
        : product.variants || [],
  }));
}

export default async function NewArrivals() {
  const products = await getNewArrivals();

  console.log("New Arrivals Products:", products);

  if (!products || products.length === 0) {
    return null;
  }

  const productsItems = products.map((p) => (
    <ProductCard key={p.product_id} product={p} />
  ));

  return (
    <div className="flex flex-col py-[50px] px-4 lg:py-[72px] max-w-screen-2xl mx-auto">
      <h2 className="self-center font-integral leading-none text-[32px] lg:text-[40px] xl:text-[48px] font-extrabold">
        New Arrivals
      </h2>

      <div className="py-[32px] justify-center items-center lg:py-[55px]">
        <MyCarousel items={productsItems} partialVisible={true} />
      </div>

      <Link
        href="/shop?sortBy=created_at_desc"
        className="self-center font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-full lg:w-[180px] border border-black/20 rounded-full text-sm py-[10px] text-center"
      >
        View All
      </Link>
    </div>
  );
}
