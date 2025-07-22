"use client";
import { useEffect, useState } from "react";

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((products) => {
        // Map 'product_id' to 'id' for each product
        const dataWithId = products.map((product) => ({
          ...product,
          id: product.product_id, // create the 'id' field for the DataTable
        }));
        setData(dataWithId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log("Products data:", data);

  return <div></div>;
};

export default Products;
