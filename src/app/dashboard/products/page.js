// app/dashboard/products/page.js
"use client";
import { useEffect, useState } from "react";
import { Modal, Alert, Table, Tag } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";
import { getProducts, getCategories } from "@/lib/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // Define columns for the nested variants table (no changes needed)
  const variantColumns = [
    { title: "SKU", dataIndex: "sku", key: "sku" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p) => `$${Number(p).toFixed(2)}`,
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attrs) =>
        (attrs || []).map((attr) => `${attr.name}: ${attr.value}`).join(", "),
    },
  ];

  const productColumns = [
    { title: "ID", dataIndex: "product_id", key: "product_id", width: 80 },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Categories",
      dataIndex: "categories",
      key: "categories",
      render: (cats) => (
        <>
          {(cats || []).map((cat) => (
            <Tag color="blue" key={cat.category_id}>
              {cat.name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p) => (p ? `$${Number(p).toFixed(2)}` : "N/A"),
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
        apiBaseUrl="products/by-id"
        rowKeyField="product_id"
        // MODIFICATION: Using 'columnsOverride' to match the DataTable prop
        columnsOverride={productColumns}
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
