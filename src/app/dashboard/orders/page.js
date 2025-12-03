"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal, App, Tag, Tooltip, Table, Spin } from "antd"; // added Table, Spin
import DataTable from "../components/DataTable";
import OrderForm from "../components/OrderForm";
import { getOrders, getProducts, getOrderById } from "@/lib/api";

const Orders = () => {
  // Data State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Expansion State (Cache for nested items)
  const [expandedOrderDetails, setExpandedOrderDetails] = useState({});
  const [expandingRows, setExpandingRows] = useState({});

  const { message } = App.useApp();

  // 1. Fetch Main Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(ordersData || []);
      setProducts(productsData?.products || []);
    } catch (err) {
      message.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Handle Expansion (Fetch items on demand)
  const handleExpand = async (expanded, record) => {
    // Only fetch if expanding AND we don't have the items cached yet
    if (expanded && !expandedOrderDetails[record.order_id]) {
      setExpandingRows((prev) => ({ ...prev, [record.order_id]: true }));
      try {
        const fullOrder = await getOrderById(record.order_id);

        // Assuming the API returns { ...order, order_items: [...] }
        // Adjust 'order_items' if your API calls it 'items' or 'products'
        const items = fullOrder.order_items || fullOrder.items || [];

        setExpandedOrderDetails((prev) => ({
          ...prev,
          [record.order_id]: items,
        }));
      } catch (err) {
        message.error("Failed to load order items");
      } finally {
        setExpandingRows((prev) => ({ ...prev, [record.order_id]: false }));
      }
    }
  };

  // 3. Render Nested Table
  const expandedRowRender = (record) => {
    const isLoading = expandingRows[record.order_id];
    const items = expandedOrderDetails[record.order_id];

    if (isLoading) {
      return (
        <div className="p-4 flex justify-center items-center gap-2 text-gray-500">
          <Spin size="small" /> Loading products...
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-gray-500 italic">
          No items found for this order.
        </div>
      );
    }

    // Columns for the NESTED table
    const itemColumns = [
      {
        title: "Product",
        dataIndex: "product_name",
        key: "product_name",
        render: (text, item) => (
          <span>{item.product_name || "Unknown Product"}</span>
        ),
      },
      {
        title: "Variant",
        dataIndex: "variant_name",
        key: "variant_name",
        render: (text) =>
          text ? <Tag>{text}</Tag> : <span className="text-gray-400">-</span>,
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
        width: 100,
      },
      {
        title: "Unit Price",
        dataIndex: "price",
        key: "price",
        render: (p) => `$${Number(p).toFixed(2)}`,
        width: 120,
        align: "right",
      },
      {
        title: "Subtotal",
        key: "line_total",
        render: (_, item) => (
          <span className="font-medium">
            {`$${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(
              2
            )}`}
          </span>
        ),
        width: 120,
        align: "right",
      },
    ];

    return (
      <div className="p-4 bg-gray-50 border-inner shadow-inner">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">
          Order Items
        </h4>
        <Table
          columns={itemColumns}
          dataSource={items}
          pagination={false}
          size="small"
          rowKey={(item) => item.order_item_id || Math.random()}
          bordered
        />
      </div>
    );
  };

  // 4. Handle Edit/Add Actions
  const handleEditOrder = async (partialOrder) => {
    setLoading(true);
    try {
      const fullOrder = await getOrderById(partialOrder.order_id);
      setEditingOrder(fullOrder);
      setIsModalOpen(true);
    } catch (err) {
      message.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingOrder(null);
    message.success(editingOrder ? "Order updated" : "Order created");
  };

  // 5. Main Table Columns
  const columnsOverride = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "order_id",
        key: "order_id",
        width: 70,
      },
      {
        title: "Token",
        dataIndex: "order_token",
        key: "order_token",
        width: 100,
        ellipsis: { showTitle: false },
        render: (token) => (
          <Tooltip title={token}>
            <span className="font-mono text-gray-500 cursor-help">
              {token?.split("-")[0]}...
            </span>
          </Tooltip>
        ),
      },
      {
        title: "Customer",
        key: "customer",
        render: (_, record) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">
              {record.client_name}
            </span>
            <span className="text-xs text-gray-400">{record.email}</span>
          </div>
        ),
      },
      {
        title: "Summary",
        key: "summary",
        render: (_, record) => (
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">
              {record.item_count}
            </span>{" "}
            items
            <span className="mx-1">•</span>
            {record.total_variants_quantities} units
          </div>
        ),
      },
      {
        title: "Total",
        dataIndex: "total_amount",
        key: "total_amount",
        align: "right",
        render: (amount) => (
          <span className="font-bold text-emerald-600">
            ${Number(amount).toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.total_amount - b.total_amount,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        align: "center",
        render: (status) => {
          const colors = {
            pending: "orange",
            completed: "green",
            cancelled: "red",
            processing: "blue",
            shipped: "cyan",
          };
          return (
            <Tag
              color={colors[status?.toLowerCase()] || "default"}
              className="m-0 min-w-[80px] text-center capitalize"
            >
              {status}
            </Tag>
          );
        },
      },
      {
        title: "Date",
        dataIndex: "order_date",
        key: "order_date",
        align: "right",
        render: (date) => (
          <span className="text-gray-500 text-sm">
            {new Date(date).toLocaleDateString()}
          </span>
        ),
        sorter: (a, b) => new Date(a.order_date) - new Date(b.order_date),
      },
    ],
    []
  );

  return (
    <div>
      <DataTable
        title="Orders"
        data={orders}
        loading={loading}
        apiBaseUrl="orders"
        rowKeyField="order_id"
        // Actions
        onReload={fetchData}
        setIsModalOpen={handleAddNew}
        onEdit={handleEditOrder}
        onDeleteSuccess={fetchData}
        // Configuration
        columnsOverride={columnsOverride}
        expandable={{
          expandedRowRender,
          onExpand: handleExpand,
          rowExpandable: (record) => record.item_count > 0, // Only expand if items exist
        }}
      />

      <Modal
        title={editingOrder ? "Edit Order" : "Create Order"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <OrderForm
          key={editingOrder ? editingOrder.order_id : "new"}
          order={editingOrder}
          onSuccess={handleSuccess}
          products={products}
        />
      </Modal>
    </div>
  );
};

export default Orders;
