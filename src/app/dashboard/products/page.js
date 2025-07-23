"use client";
import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((products) => {
        setData(products);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  console.log("Products data:", data);

  return (
    <div>
      <DataTable data={data} loading={loading} setLoading={setLoading} />
    </div>
  );
};

export default Products;
