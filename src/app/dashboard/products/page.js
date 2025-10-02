// app/dashboard/products/page.js
"use client";
import { useEffect, useState } from "react";
import { Modal, Alert, Table } from "antd"; // Import Table for the sub-table
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
      .then(([productsData, categoriesData]) => {
        // Ensure variants is always an array
        const formattedProducts = productsData.map((p) => ({
          ...p,
          variants: p.variants || [],
        }));
        setProducts(formattedProducts);
        setCategories(categoriesData);
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
      // Use the correct by-id endpoint
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

  // Define columns for the nested variants table
  const variantColumns = [
    { title: "SKU", dataIndex: "sku", key: "sku" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price}`,
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) =>
        (attributes || [])
          .map((attr) => `${attr.name}: ${attr.value}`)
          .join(", "),
    },
  ];

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
        apiBaseUrl="products/by-id" // Your API is at /api/products/[id]
        rowKeyField="product_id"
        // Show variants in an expandable row
        expandable={{
          expandedRowRender: (record) => (
            <Table
              columns={variantColumns}
              dataSource={record.variants}
              rowKey="variant_id"
              pagination={false}
            />
          ),
          rowExpandable: (record) =>
            record.variants && record.variants.length > 0,
        }}
        columnsOverride={[
          { key: "product_id", title: "ID" },
          { key: "name", title: "Name" },
          { key: "slug", title: "Slug" },
          { key: "category_id", title: "Category" },
          { key: "created_at", title: "Created" },
        ]}
      />

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800} // Make modal wider for the variants UI
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
