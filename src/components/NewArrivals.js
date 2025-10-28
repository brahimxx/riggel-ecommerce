import ProductCard from "./ProductCard";
import pool from "@/lib/db";
import MyCarousel from "./MyCarousel";

// Revalidate this component every 5 minutes (works even without fetch)
export const revalidate = 300; // ISR for non-fetch data [web:92]

export async function getNewArrivals() {
  // kayen two options here, first is to use a base api url and use the api, because the api call in the server side needs an absolute url, second is to query DB in the component directly
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
        -- THIS IS THE NEW PART --
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('category_id', c.category_id, 'name', c.name)
          )
          FROM product_categories pc
          JOIN categories c ON pc.category_id = c.category_id
          WHERE pc.product_id = p.product_id
        ) AS categories
     FROM products p
     ORDER BY p.created_at DESC
     LIMIT 8;`
  );

  // MODIFICATION: Safely parse the categories string from the database.
  return rows.map((product) => ({
    ...product,
    categories:
      typeof product.categories === "string"
        ? JSON.parse(product.categories)
        : product.categories || [],
  }));
}

export default async function NewArrivals() {
  const products = await getNewArrivals();

  const productsItems = products.map((p) => (
    <ProductCard key={p.product_id} product={p} />
  ));

  return (
    <div className="flex flex-col py-[50px] px-4 lg:py-[72px] max-w-screen-2xl mx-auto">
      <h2 className="self-center font-integral leading-none text-[32px] lg:text-[40px] xl:text-[48px] font-extrabold">
        New Arrivals
      </h2>

      <div className="py-[32px]  justify-center items-center lg:py-[55px]">
        <MyCarousel items={productsItems} partialVisible={true} />
      </div>

      <a
        href="/products?sort=new"
        className="self-center font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-full lg:w-[180px] border border-black/20 rounded-full text-sm py-[10px] text-center"
      >
        View All
      </a>
    </div>
  );
}
