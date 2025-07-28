"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";

const Products = () => {
  const [data, setData] = useState([]); // For products
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = () => {
    setLoading(true);

    Promise.all([
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
    ])
      .then(([products, categories]) => {
        setData(products);
        setCategories(categories);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProduct(null); // Reset
  };

  const handleSuccess = () => {
    fetchData(); // Refresh product list
    setIsModalOpen(false); // Close modal
    setEditingProduct(null); // Reset form
  };

  return (
    <div>
      {error && (
        <Alert message="Error" description={error} type="error" showIcon />
      )}

      <DataTable
        data={data}
        loading={loading}
        setLoading={setLoading}
        setIsModalOpen={setIsModalOpen}
        setEditingProduct={setEditingProduct}
      />
      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <ProductForm
          product={editingProduct}
          onSuccess={handleSuccess}
          categories={categories}
        />
      </Modal>
    </div>
  );
};

export default Products;
