"use client";
import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";

const Orders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((response) => response.json())
      .then((order) => {
        setData(order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DataTable data={data} loading={loading} setLoading={setLoading} />
    </div>
  );
};

export default Orders;
