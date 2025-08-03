"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import OrderForm from "../components/OrderForm";

const Orders = () => {
  const [orders, setOrders] = useState([]); // renamed for clarity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]); // For product selection inside order items

  // Fetch orders and products (needed for order items)
  const fetchData = () => {
    setLoading(true);

    Promise.all([
      fetch("/api/orders").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()),
    ])
      .then(([orders, products]) => {
        setOrders(orders);
        setProducts(products);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setError(null);
  };

  const handleSuccess = () => {
    fetchData(); // Refresh orders list after add/update
    setIsModalOpen(false);
    setEditingOrder(null);
    setError(null);
  };

  const handleEditOrder = async (order) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const fullOrder = await res.json();
      setEditingOrder(fullOrder);
      setIsModalOpen(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
        width={800} // wider modal for order form
      >
        <OrderForm
          order={editingOrder}
          onSuccess={handleSuccess}
          products={products} // needed for order item selection
        />
      </Modal>
    </div>
  );
};

export default Orders;
