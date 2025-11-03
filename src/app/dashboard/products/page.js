// app/dashboard/products/page.js
"use client";
import { useEffect, useState } from "react";
import { Modal, Alert, Table, Tag } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";
import { getProducts, getCategories } from "@/lib/api";

const PAGE_SIZE = 9; // Define a page size constant

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: pageSize,
      };

      const [productsData, categoriesData] = await Promise.all([
        getProducts(filters),
        getCategories(),
      ]);

      // Handle the paginated response structure
      setProducts(productsData.products || productsData || []);
      setTotalProducts(
        productsData.total || productsData.products?.length || 0
      );
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when page or pageSize changes
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to page 1 when page size changes
  };

  // Define columns for the nested variants table
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
        data={{
          products: products,
          pagination: {
            page: currentPage,
            limit: pageSize,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / pageSize),
          },
        }}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEditProduct}
        onDeleteSuccess={fetchData}
        apiBaseUrl="products/by-id"
        rowKeyField="product_id"
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
        width={800}
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
