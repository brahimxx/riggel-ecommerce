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
  const [products, setProducts] = useState([]); // isMounted ref is a good practice to avoid state updates on unmounted components

  const isMounted = useRef(true); // MODIFICATION: The fetchData function is now much cleaner and more readable.

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      if (isMounted.current) {
        // FIX: Extract the array from the response object.
        setOrders(ordersResponse || []);
        setProducts(productsResponse?.products || []);
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
  }; // MODIFICATION: Using the new 'getOrderById' helper function.

  const handleEditOrder = async (order) => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const orderResponse = await getOrderById(order.order_id);
      if (isMounted.current) {
        // FIX: Extract the single order object from the response.
        setEditingOrder(orderResponse?.order);
        setIsModalOpen(true);
      }
    } catch (error) {
      if (isMounted.current) setError(error.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };
  console.log(orders);
  return (
    <div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
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
