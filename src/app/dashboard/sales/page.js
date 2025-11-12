"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import SalesForm from "../components/SalesForm";
import { getSales, getSaleById } from "@/lib/api"; // You'll create these API helpers

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const isMounted = useRef(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const salesData = await getSales();
      if (isMounted.current) setSales(salesData || []);
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
    setEditingSale(null);
    setError(null);
  };

  const handleSuccess = () => {
    if (!isMounted.current) return;
    fetchData();
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const handleEditSale = async (sale) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const fullSale = await getSaleById(sale.id);
      if (isMounted.current) {
        setEditingSale(fullSale);
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
        data={sales}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditSale}
        onDeleteSuccess={fetchData}
        apiBaseUrl="sales"
        rowKeyField="id"
      />
      <Modal
        title={editingSale ? "Edit Sale" : "Add Sale"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <SalesForm sale={editingSale} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default Sales;
