// lib/api.js

// Used mainly by the client side components to fetch data from the API routes

export async function getProducts(filters = {}) {
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
  if (filters.category_id) {
    params.append("category_id", filters.category_id);
  }
  if (filters.query) {
    params.append("query", filters.query);
  }
  // --- FIX: Add sortBy, page and limit to the URL parameters ---
  if (filters.sortBy) {
    params.append("sortBy", filters.sortBy);
  }
  if (filters.page) {
    params.append("page", filters.page);
  }
  if (filters.limit) {
    params.append("limit", filters.limit);
  }
  // ----------------------------------------------------

  const queryString = params.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw error;
  }
}

export async function getCategories() {
  try {
    const response = await fetch("/api/categories", {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in getCategories:", error);
    throw error;
  }
}

// --- NEW FUNCTIONS FOR ORDERS ---

export async function getOrders() {
  try {
    const response = await fetch("/api/orders", {
      next: "no-store", // Cache orders list
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in getOrders:", error);
    throw error;
  }
}

export async function getOrderById(id) {
  try {
    const response = await fetch(`/api/orders/${id}`, {
      cache: "no-store", // Fetch fresh details for editing
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch order ${id}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error in getOrderById for id ${id}:`, error);
    throw error;
  }
}

// --- NEW FUNCTIONS FOR ATTRIBUTES ---

export async function getAttributes() {
  try {
    const response = await fetch("/api/attributes");
    if (!response.ok) {
      throw new Error("Failed to fetch attributes");
    }
    return response.json();
  } catch (error) {
    console.error("Error in getAttributes:", error);
    throw error;
  }
}

export async function createAttribute(name) {
  try {
    const response = await fetch("/api/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create attribute");
    }
    return response.json();
  } catch (error) {
    console.error("Error in createAttribute:", error);
    throw error;
  }
}

export async function updateAttribute(id, name) {
  try {
    // Assuming your API for updating a name is PUT /api/attributes/[id]
    const response = await fetch(`/api/attributes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update attribute");
    }
    return response.json();
  } catch (error) {
    console.error(`Error in updateAttribute for id ${id}:`, error);
    throw error;
  }
}

export async function updateAttributeValues(id, values) {
  try {
    // This function handles updating the list of values for an attribute.
    // Your component already used PUT /api/attributes for this.
    const response = await fetch("/api/attributes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attribute_id: id, values }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update attribute values");
    }
    return response.json();
  } catch (error) {
    console.error(`Error in updateAttributeValues for id ${id}:`, error);
    throw error;
  }
}

export async function deleteAttribute(id) {
  try {
    const response = await fetch(`/api/attributes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete attribute");
    }
    return response.json();
  } catch (error) {
    console.error(`Error in deleteAttribute for id ${id}:`, error);
    throw error;
  }
}

// --- NEW FUNCTIONS FOR USERS ---

export async function getUsers() {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  } catch (error) {
    console.error("Error in getUsers:", error);
    throw error;
  }
}

export async function getUserById(id) {
  try {
    const response = await fetch(`/api/users/${id}`, {
      cache: "no-store", // Always get fresh data for editing
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch user ${id}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error in getUserById for id ${id}:`, error);
    throw error;
  }
}

// Assumed you will have an endpoint for roles
export async function getRoles() {
  try {
    // Assuming an endpoint like /api/roles exists or will exist
    const response = await fetch("/api/roles");
    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }
    return response.json();
  } catch (error) {
    console.error("Error in getRoles:", error);
    return []; // Return empty array on failure so UI doesn't break
  }
}

// --- NEW FUNCTIONS FOR SALES ---
export const getSales = async () => {
  const res = await fetch("/api/sales");
  if (!res.ok) throw new Error("Failed to fetch sales");
  return await res.json();
};
export const getSaleById = async (id) => {
  const res = await fetch(`/api/sales/${id}`);
  if (!res.ok) throw new Error("Failed to fetch sale");
  return await res.json();
};
export function getSalePrice(product) {
  if (!product.sale_id) return product.price;
  if (product.discount_type === "percentage") {
    return (product.price * (1 - product.discount_value / 100)).toFixed(2);
  }
  if (product.discount_type === "fixed") {
    return (product.price - product.discount_value).toFixed(2);
  }
  return product.price;
}
