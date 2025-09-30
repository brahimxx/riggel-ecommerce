import Image from "next/image";

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
  console.log("Rendering product:", product);
  return (
    <main className="max-w-4xl mx-auto p-4 mt-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="relative w-full md:w-[400px] h-[320px] md:h-[480px] rounded-xl overflow-hidden shadow border">
          <Image
            src={
              product.images[0].url ||
              "/images/products_images/product_test.png"
            }
            alt={product.name}
            fill
            className="object-contain bg-white"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>
        <div className="flex-1 flex flex-col justify-start gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-2 text-yellow-500">
            <span>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(product.rating ?? 0)
                      ? "fill-yellow-500"
                      : "fill-gray-300"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <polygon points="9.9,1.2 12.3,7.4 19,7.8 13.9,12.1 15.4,18.7 9.9,15.1 4.4,18.7 5.9,12.1 0.8,7.8 7.5,7.4 " />
                </svg>
              ))}
            </span>
            <span className="text-gray-500 ml-2 text-sm">
              {Number(product.rating)?.toFixed(2)}/5
            </span>
          </div>
          <p className="text-lg text-gray-900 font-semibold">
            {" "}
            ${product.price}
          </p>
          <p className="text-gray-700">{product.description}</p>
          <p className="text-sm text-gray-500">
            {" "}
            <b>In Stock:</b> {product.quantity}
          </p>
          {/* Actions: Add to Cart, Wishlist, etc */}
          <div className="flex flex-row gap-3 mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
