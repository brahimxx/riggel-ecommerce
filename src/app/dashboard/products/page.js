"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";

const Products = () => {
  const [products, setProducts] = useState([]);
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

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setError(null);
  };

  const handleSuccess = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleEditProduct = async (product) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/by-id/${product.product_id}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      const fullProduct = await res.json();
      setEditingProduct(fullProduct);
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
        data={products}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditProduct}
        onDeleteSuccess={fetchData}
        apiBaseUrl="products/by-id"
        rowKeyField="product_id"
        columnsOverride={[
          { key: "product_id", title: "ID" },
          { key: "name", title: "Name" },
          { key: "slug", title: "Slug" }, // explicit
          { key: "price", title: "Price" },
          { key: "quantity", title: "Qty" },
          { key: "rating", title: "Rating" }, // explicit
          { key: "category_id", title: "Category" },
          { key: "created_at", title: "Created" },
        ]}
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
