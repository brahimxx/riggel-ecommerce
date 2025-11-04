// app/dashboard/components/OrderForm.js
import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Table,
  message,
  Divider,
} from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;
const statusOptions = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
];

const OrderForm = ({ order = null, products = [], onSuccess }) => {
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState([]);
  const [tempIdCounter, setTempIdCounter] = useState(0);

  // Create a flattened list of all variants from all products
  const variantsList = useMemo(() => {
    return products.flatMap((p) =>
      (p.variants || []).map((v) => ({
        ...v,
        product_name: p.name,
        display_name: `${p.name} - ${(v.attributes || [])
          .map((a) => a.value)
          .join(", ")} (SKU: ${v.sku || "N/A"})`,
      }))
    );
  }, [products]);

  useEffect(() => {
    if (order && order.order_items) {
      const itemsWithKeys = order.order_items.map((item, index) => ({
        ...item,
        key: item.order_item_id || `temp-${index}`,
      }));
      setOrderItems(itemsWithKeys);
      form.setFieldsValue({
        ...order,
        order_date: order.order_date ? dayjs(order.order_date) : null,
      });
    } else {
      form.resetFields();
      setOrderItems([]);
    }
  }, [order, form]);

  const updateOrderItem = (key, field, value) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const addOrderItem = () => {
    const newKey = `temp-${tempIdCounter}`;
    setTempIdCounter((c) => c + 1);
    setOrderItems((items) => [
      ...items,
      { key: newKey, variant_id: null, quantity: 1, price: 0 },
    ]);
  };

  const removeOrderItem = (key) => {
    setOrderItems((items) => items.filter((item) => item.key !== key));
  };

  const calcTotalAmount = () =>
    orderItems.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );

  useEffect(() => {
    form.setFieldsValue({ total_amount: calcTotalAmount() });
  }, [orderItems, form]);

  const onFinish = async (values) => {
    if (orderItems.length === 0)
      return message.error("At least one order item is required");

    for (const item of orderItems) {
      if (!item.variant_id)
        return message.error("All order items must have a variant selected");
      const variant = variantsList.find(
        (v) => v.variant_id === item.variant_id
      );
      if (!variant)
        return message.error(`Variant with ID ${item.variant_id} not found.`);

      const originalItem = order?.order_items?.find(
        (oi) => oi.variant_id === item.variant_id
      );
      const reservedQty = originalItem ? originalItem.quantity : 0;
      const effectiveAvailable = variant.quantity + reservedQty;

      if (item.quantity > effectiveAvailable) {
        return message.error(
          `Not enough stock for "${variant.display_name}". Available: ${effectiveAvailable}`
        );
      }
    }

    const payload = {
      ...values,
      order_date: values.order_date.toISOString(),
      total_amount: calcTotalAmount(),
      order_items: orderItems.map(({ key, ...rest }) => ({
        ...rest,
        price: Number(rest.price),
        quantity: Number(rest.quantity),
      })),
    };

    const url = order ? `/api/orders/${order.order_id}` : "/api/orders";
    const method = order ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "API request failed");
      }
      message.success(`Order ${order ? "updated" : "created"} successfully`);
      onSuccess?.();
    } catch (err) {
      message.error(err.message || "Error submitting order.");
    }
  };

  const orderItemColumns = [
    {
      title: "Product Variant",
      dataIndex: "variant_id",
      render: (value, record) => (
        <Select
          showSearch
          placeholder="Select a variant"
          value={value}
          style={{ width: 300 }}
          onChange={(val) => {
            const selectedVariant = variantsList.find(
              (v) => v.variant_id === val
            );
            updateOrderItem(record.key, "variant_id", val);
            if (selectedVariant) {
              updateOrderItem(record.key, "price", selectedVariant.price);
            }
          }}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={variantsList.map((v) => ({
            value: v.variant_id,
            label: v.display_name,
          }))}
        />
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => updateOrderItem(record.key, "quantity", val)}
        />
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => updateOrderItem(record.key, "price", val)}
        />
      ),
    },
    {
      title: "Total",
      render: (_, record) =>
        `$${((record.quantity || 0) * (record.price || 0)).toFixed(2)}`,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button danger size="small" onClick={() => removeOrderItem(record.key)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* Client Info Fields (client_name, email, etc.) - No changes needed here */}
      <Form.Item
        label="Client Name"
        name="client_name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="Shipping Address"
        name="shipping_address"
        rules={[{ required: true }]}
      >
        <TextArea rows={2} />
      </Form.Item>
      <Form.Item
        label="Order Date"
        name="order_date"
        rules={[{ required: true }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Status" name="status" rules={[{ required: true }]}>
        <Select
          options={statusOptions.map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
      </Form.Item>

      <Divider>Order Items</Divider>
      <Button onClick={addOrderItem} type="dashed" style={{ marginBottom: 16 }}>
        + Add Item
      </Button>
      <Table
        dataSource={orderItems}
        columns={orderItemColumns}
        pagination={false}
        rowKey="key"
        size="small"
      />

      <div style={{ textAlign: "right", marginTop: "16px", fontSize: "1.2em" }}>
        <strong>Total: ${calcTotalAmount().toFixed(2)}</strong>
      </div>

      <Form.Item style={{ marginTop: "24px" }}>
        <Button type="primary" htmlType="submit">
          {order ? "Update Order" : "Create Order"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default OrderForm;
