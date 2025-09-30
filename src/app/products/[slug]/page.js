import Image from "next/image";
import { Rate } from "antd";
import ColorSelector from "@/components/ColorSelector";
import SizeSelector from "@/components/SizeSelector";
import QuantityCartBar from "@/components/QuantityCartBar";
import ProductGallery from "@/components/ProductGallery";

// SERVER COMPONENT: fetch and render product detail
async function getProduct(slug) {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? process.env.API_BASE_URL
    : "http://localhost:3000/";

  const res = await fetch(`${baseUrl}/api/products/by-slug/${slug}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Fetch product failed:", errorText);
    throw new Error("Failed to fetch product");
  }
  return await res.json();
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product;

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
  } // Defensive fallback

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
  return (
    <>
      <div className="flex max-w-screen-2xl mx-auto px-4 ">
        <div className="flex w-[50%]">
          <div className="relative w-full  h-[530px] overflow-hidden">
            <ProductGallery images={product.images} />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-[14px] pl-10 max-h-[530px]">
          <h2 className="font-integral leading-none text-[32px] lg:text-[40px]  font-extrabold">
            {product.name}
          </h2>
          <div className="flex relative ">
            <Rate
              disabled
              allowHalf
              defaultValue={Number(product.rating) || 0}
            />
            <span className="text-gray-500 ml-2 text-sm">
              {Number(product.rating)?.toFixed(2)}/5
            </span>
          </div>
          <p className="text-[32px] text-gray-900 font-semibold">
            ${product.price}
          </p>
          <p className="text-4 text-gray-700">{product.description}</p>
          <div className="py-[10px] border-t-[2px] border-gray-200/60">
            <ColorSelector />
          </div>
          <div className="py-[10px] border-y-[2px] border-gray-200/60">
            <SizeSelector />
          </div>
          <div className="pt-[10px] border-gray-200/60">
            <QuantityCartBar />
          </div>
        </div>
      </div>
    </>
  );
}
