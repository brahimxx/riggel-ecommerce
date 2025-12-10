"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal, App, Table, Tag, Avatar, Rate, Badge, Typography } from "antd";
import DataTable from "../components/DataTable";
import ProductForm from "../components/ProductForm";
import { getProducts, getCategories } from "@/lib/api";

const { Text } = Typography;
const PAGE_SIZE = 9;

const Products = () => {
  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { message } = App.useApp();

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { page: currentPage, limit: pageSize };

      const [productsData, categoriesData] = await Promise.all([
        getProducts(filters),
        getCategories(),
      ]);

      // Handle response structure { products: [], total: 100, ... }
      setProducts(productsData.products || []);
      setTotalProducts(productsData.total || 0);
      setCategories(categoriesData || []);
    } catch (err) {
      message.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Actions
  const handleEditProduct = async (product) => {
    setLoading(true);
    try {
      // Fetch full details including variants/images
      const res = await fetch(`/api/products/${product.product_id}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      const fullProduct = await res.json();
      setEditingProduct(fullProduct);
      setIsModalOpen(true);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingProduct(null);
    message.success(editingProduct ? "Product updated" : "Product created");
  };

  // 3. Main Columns
  const productColumns = useMemo(
    () => [
      {
        title: "Product",
        key: "product",
        width: 300,
        render: (_, record) => (
          <div className="flex items-center gap-3">
            <Avatar
              shape="square"
              size={64}
              src={record.main_image}
              className="border border-gray-200 bg-gray-50"
            />
            <div className="flex flex-col justify-center">
              <Text strong className="text-base line-clamp-1">
                {record.sale_id && (
                  <Tag color="red" className="!text-[10px] m-0">
                    SALE
                  </Tag>
                )}
                {record.name}
              </Text>
              <div className="flex gap-1 mt-1">
                <Rate
                  disabled
                  defaultValue={Number(record.rating)}
                  className="text-xs"
                />
                <span className="text-xs text-gray-400">
                  ({record.total_orders} orders)
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        render: (price, record) => (
          <div className="flex flex-col">
            {record.sale_id ? (
              <>
                <Text delete className="!text-gray-400 text-xs">
                  ${Number(price).toFixed(2)}
                </Text>
                <Text strong className="!text-red-500">
                  ${(price * (1 - record.discount_value / 100)).toFixed(2)}
                  {/* ^ Simple approximation if percent, adjust logic based on discount_type */}
                </Text>
              </>
            ) : (
              <Text strong>${Number(price).toFixed(2)}</Text>
            )}
          </div>
        ),
        width: 100,
      },
      {
        title: "Inventory",
        key: "inventory",
        render: (_, record) => {
          const total = parseInt(record.total_variants_quantities || 0);
          let statusColor = "success";
          if (total === 0) statusColor = "error";
          else if (total < 10) statusColor = "warning";

          return <Badge status={statusColor} text={`${total} units`} />;
        },
        width: 120,
      },
      {
        title: "Categories",
        dataIndex: "categories",
        key: "categories",
        render: (cats) => (
          <div className="flex flex-wrap gap-1">
            {(cats || []).slice(0, 3).map((cat) => (
              <Tag key={cat.category_id} className="m-0 text-xs">
                {cat.name}
              </Tag>
            ))}
            {(cats || []).length > 3 && (
              <Tag className="m-0 text-xs">+{cats.length - 3}</Tag>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // 4. Nested Variant Table
  const expandedRowRender = (record) => {
    const variantColumns = [
      {
        title: "SKU",
        dataIndex: "sku",
        key: "sku",
        render: (sku) => <span className="font-mono text-xs">{sku}</span>,
      },
      {
        title: "Attributes",
        dataIndex: "attributes",
        key: "attributes",
        render: (attrs) => (
          <div className="flex gap-2">
            {(attrs || []).map((attr, i) => (
              <Tag key={i} className="m-0 bg-white">
                <span className="text-gray-500">{attr.name}: </span>
                <span className="font-medium">{attr.value}</span>
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        render: (p) => `$${Number(p).toFixed(2)}`,
      },
      {
        title: "Qty",
        dataIndex: "quantity",
        key: "quantity",
        render: (q) => (
          <span className={q < 5 ? "text-red-500 font-bold" : "text-gray-700"}>
            {q}
          </span>
        ),
      },
    ];

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
          Product Variants
        </h4>
        <Table
          columns={variantColumns}
          dataSource={record.variants}
          rowKey="variant_id"
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  };

  return (
    <div>
      <DataTable
        title="Products Inventory"
        // Pass pagination data structure
        data={{
          products: products,
          pagination: {
            page: currentPage,
            limit: pageSize,
            total: totalProducts,
          },
        }}
        loading={loading}
        apiBaseUrl="products/"
        rowKeyField="product_id"
        // Actions
        onReload={fetchData}
        setIsModalOpen={handleAddNew}
        onEdit={handleEditProduct}
        onDeleteSuccess={fetchData}
        // Pagination Handlers
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        // Columns & Expansion
        columnsOverride={productColumns}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) =>
            record.variants && record.variants.length > 0,
        }}
      />

      <Modal
        title={editingProduct ? "Edit Product" : "Create Product"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <ProductForm
          key={editingProduct ? editingProduct.product_id : "new"}
          product={editingProduct}
          onSuccess={handleSuccess}
          categories={categories}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Products;
