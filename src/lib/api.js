// lib/api.js

//Used mainly by the client side components to fetch data from the API routes

export async function getProducts(filters = {}) {
  // This function correctly constructs the URL based on the filters
  const params = new URLSearchParams();

  if (filters.colors && filters.colors.length > 0) {
    params.append("colors", filters.colors.join(","));
  }
  if (filters.sizes && filters.sizes.length > 0) {
    params.append("sizes", filters.sizes.join(","));
  }
  if (filters.price) {
    params.append("minPrice", filters.price[0]);
    params.append("maxPrice", filters.price[1]);
  }
  if (filters.category) {
    // Assuming you filter by category name
    params.append("category", filters.category);
  }

  const queryString = params.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Use Next.js caching features
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in getProducts:", error);
    // Re-throw so the component's try/catch block can handle it
    throw error;
  }
}
