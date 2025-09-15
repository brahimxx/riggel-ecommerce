"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";

const Products = () => {
  const [products, setProducts] = useState([]); // For products
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
        setProducts(products);
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
    setEditingProduct(null);
    setError(null); // clear error on modal close
  };

  const handleSuccess = () => {
    fetchData(); // Refresh product list
    setIsModalOpen(false); // Close modal
    setEditingProduct(null); // Reset form
  };

  const handleEditProduct = async (product) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.product_id}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      const fullProduct = await res.json();
      setEditingProduct(fullProduct);
      setIsModalOpen(true);
      console.log(fullProduct);
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
        data={products}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditProduct}
        onDeleteSuccess={fetchData}
        apiBaseUrl="products"
        rowKeyField="product_id"
      />

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
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
