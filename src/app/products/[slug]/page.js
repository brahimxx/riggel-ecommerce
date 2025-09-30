import ProductTabs from "@/components/ProductTabs/ProductTabs";
import ProductShowcase from "@/components/ProductShowcase";
import ProductReviewsTab from "@/components/ProductReviewsTab";
import YouMightAlsoLike from "@/components/YouMightAlsoLike";

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

async function getReviews(productId) {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? process.env.API_BASE_URL
    : "http://localhost:3000/";

  const res = await fetch(`${baseUrl}/api/reviews/${productId}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Fetch reviews failed:", errorText);
    return [];
  }
  return await res.json();
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

  try {
    if (product?.product_id) {
      reviews = await getReviews(product.product_id);
    }
  } catch (e) {
    console.error("Error fetching reviews:", e);
  }

  const tabs = ["", <ProductReviewsTab reviews={reviews} />, ""];

  return (
    <div className="flex flex-col max-w-screen-2xl mx-auto px-4">
      <ProductShowcase product={product} />
      <ProductTabs>{tabs}</ProductTabs>
      <YouMightAlsoLike />
    </div>
  );
}
