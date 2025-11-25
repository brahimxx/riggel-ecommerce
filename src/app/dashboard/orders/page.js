"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import OrderForm from "../components/OrderForm";
// Uses the updated helpers (getOrders, getProducts, getOrderById/getOrder)
import { getOrders, getProducts, getOrderById } from "@/lib/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]);

  const isMounted = useRef(true);

  const fetchData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);

      if (isMounted.current) {
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
    setError(null);
    try {
      // getOrderById now returns the full order object ({ ...fields, order_items: [...] })
      const orderResponse = await getOrderById(order.order_id);

      if (isMounted.current) {
        setEditingOrder(orderResponse); // not orderResponse?.order
        setIsModalOpen(true);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

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
