// lib/api.js

// Used mainly by the client side components to fetch data from the API routes

export async function getProducts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.onSale) {
    params.append("on_sale", "true");
  }
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
  if (filters.type_category_id) {
    params.append("type_category_id", filters.type_category_id);
  }
  if (filters.style_category_id) {
    params.append("style_category_id", filters.style_category_id);
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

// Fetch all orders (admin list)
export async function getOrders() {
  try {
    const response = await fetch("/api/orders", {
      cache: "no-store", // do not cache the list
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

// Generic: works with numeric id *or* order_token
export async function getOrder(identifier) {
  try {
    const response = await fetch(`/api/orders/${identifier}`, {
      cache: "no-store", // always fetch fresh
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch order ${identifier}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error in getOrder for identifier ${identifier}:`, error);
    throw error;
  }
}

// Convenience wrappers (optional)
export function getOrderById(id) {
  return getOrder(id); // e.g. admin panel
}

export function getOrderByToken(token) {
  return getOrder(token); // e.g. public thank-you page
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

export async function createAttribute(name, values = []) {
  try {
    const response = await fetch("/api/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, values }), // ✅ Added values support
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

export async function updateAttribute(id, name, values = []) {
  try {
    const response = await fetch(`/api/attributes/${id}`, {
      // ✅ Fixed path
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, values }), // ✅ Added values support
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
    const response = await fetch(`/api/attributes/${id}`, {
      // ✅ Fixed path - was /api/attributes
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }), // ✅ Removed attribute_id from body
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
function isSaleActive(sale) {
  if (!sale) return false;
  const now = new Date();
  const start = new Date(sale.start_date);
  const end = new Date(sale.end_date);
  return now >= start && now <= end;
}
export function getSalePrice(product, basePrice) {
  const sale = product.sale;
  if (!sale || !isSaleActive(sale)) return basePrice;
  if (sale.discount_type === "percentage") {
    return (basePrice * (1 - sale.discount_value / 100)).toFixed(2);
  }
  if (sale.discount_type === "fixed") {
    return (basePrice - sale.discount_value).toFixed(2);
  }
  return basePrice;
}
