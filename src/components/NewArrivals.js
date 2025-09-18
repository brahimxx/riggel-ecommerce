import ProductCard from "./ProductCard";
import pool from "@/lib/db";

// Revalidate this component every 5 minutes (works even without fetch)
export const revalidate = 300; // ISR for non-fetch data [web:92]

export async function getNewArrivals() {
  // kayen two options here, first is to use a base api url and use the api, because the api call in the server side needs an absolute url, second is to query DB in the component directly
  const [rows] = await pool.query(
    `SELECT p.product_id, p.name, p.slug, p.description, p.price, p.category_id, p.created_at, p.quantity, p.rating,
            (
              SELECT pi.url
              FROM product_images pi
              WHERE pi.product_id = p.product_id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
              LIMIT 1
            ) AS main_image
     FROM products p
     ORDER BY p.created_at DESC
     LIMIT 4;`
  );
  return rows;
}

export default async function NewArrivals() {
  const products = await getNewArrivals();

  return (
    <div className="flex flex-col py-[72px] max-w-screen-2xl mx-auto">
      <h2 className="self-center font-integral leading-none text-[48px] font-extrabold">
        New Arrivals
      </h2>

      <div className="flex justify-between py-[55px]">
        {products.map((p) => (
          <ProductCard key={p.product_id} product={p} />
        ))}
      </div>

      <a
        href="/products?sort=new"
        className="self-center font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-[180px] border border-black/20 rounded-full text-sm py-3 text-center"
      >
        View All
      </a>
    </div>
  );
}
