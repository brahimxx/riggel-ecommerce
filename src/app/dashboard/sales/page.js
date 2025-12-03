// app/dashboard/pages/Sales.js
"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert, App } from "antd";
import DataTable from "../components/DataTable";
import SalesForm from "../components/SalesForm";
import { getSales, getSaleById } from "@/lib/api";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const isMounted = useRef(true);

  const { message } = App.useApp();

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
    message.success(
      editingSale ? "Sale updated successfully" : "Sale created successfully"
    );
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

  // Ensure we clear editing state when opening modal for "Add New"
  const handleAddNew = () => {
    setEditingSale(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      <DataTable
        data={sales}
        title="Sales"
        loading={loading}
        setIsModalOpen={handleAddNew} // Use helper to clear editingSale
        onEdit={handleEditSale}
        onDeleteSuccess={fetchData}
        onReload={fetchData} // <--- ADDED THIS
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
