"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import OrderForm from "../components/OrderForm";
// MODIFICATION: Import your new API helpers
import { getOrders, getProducts, getOrderById } from "@/lib/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]);

  // isMounted ref is a good practice to avoid state updates on unmounted components
  const isMounted = useRef(true);

  // MODIFICATION: The fetchData function is now much cleaner and more readable.
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      if (isMounted.current) {
        setOrders(ordersData);
        setProducts(productsData);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false; // Cleanup function to set isMounted to false
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

  // MODIFICATION: Using the new 'getOrderById' helper function.
  const handleEditOrder = async (order) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const fullOrder = await getOrderById(order.order_id);
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
          products={products}
        />
      </Modal>
    </div>
  );
};

export default Orders;
