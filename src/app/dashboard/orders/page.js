// app/dashboard/orders/page.js
"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import OrderForm from "../components/OrderForm";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]); // This will now hold products with variants

  const isMounted = useRef(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/orders").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()), // This API now returns variants
    ])
      .then(([ordersData, productsData]) => {
        if (isMounted.current) {
          setOrders(ordersData);
          setProducts(productsData); // Pass the full product data with variants
        }
      })
      .catch((err) => {
        if (isMounted.current) setError(err.message);
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleCancel = () => {
    if (!isMounted.current) return;
    setIsModalOpen(false);
    setEditingOrder(null);
    setError(null);
  };

  const handleSuccess = () => {
    if (!isMounted.current) return;
    fetchData();
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleEditOrder = async (order) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const fullOrder = await res.json();
      if (isMounted.current) {
        setEditingOrder(fullOrder);
        setIsModalOpen(true);
      }
    } catch (error) {
      if (isMounted.current) setError(error.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert message="Error" description={error} type="error" showIcon />
      )}
      <DataTable
        data={orders}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditOrder}
        onDeleteSuccess={fetchData}
        apiBaseUrl="orders"
        rowKeyField="order_id"
      />
      <Modal
        title={editingOrder ? "Edit Order" : "Add Order"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <OrderForm
          order={editingOrder}
          onSuccess={handleSuccess}
          products={products} // Pass products with variants down to the form
        />
      </Modal>
    </div>
  );
};

export default Orders;
