import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Table,
  Space,
  message,
} from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;

const statusOptions = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrderForm = ({ order = null, products = [], onSuccess }) => {
  const [form] = Form.useForm();

  // Track order items separately for dynamic rows
  const [orderItems, setOrderItems] = useState(order?.order_items || []);

  // Initialize form fields on order change
  useEffect(() => {
    if (order) {
      form.setFieldsValue({
        client_name: order.client_name || "",
        email: order.email || "",
        phone: order.phone || "",
        shipping_adresse: order.shipping_adresse || "",
        order_date: order.order_date ? dayjs(order.order_date) : null,
        status: order.status || "pending",
        total_amount: order.total_amount ?? 0,
      });
      setOrderItems(order.order_items || []);
    } else {
      form.resetFields();
      setOrderItems([]);
    }
  }, [order, form]);

  // Handlers for order items table

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        product_id: null,
        quantity: 1,
        price: 0,
        key: Date.now(), // unique key for React list
      },
    ]);
  };

  const removeOrderItem = (key) => {
    setOrderItems(orderItems.filter((item) => item.key !== key));
  };

  const updateOrderItem = (key, field, value) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  // Calculate total_amount automatically from order items
  const calcTotalAmount = () => {
    return orderItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
      0
    );
  };

  // Form submit handler
  const onFinish = async (values) => {
    // Must have at least one order item
    if (orderItems.length === 0) {
      message.error("At least one order item is required");
      return;
    }

    // Basic validation for order items
    for (const item of orderItems) {
      if (!item.product_id) {
        message.error("All order items must have a product selected");
        return;
      }
      if (item.quantity <= 0) {
        message.error("Quantities must be greater than zero");
        return;
      }
      if (item.price < 0) {
        message.error("Price cannot be negative");
        return;
      }
    }

    const payload = {
      ...values,
      order_date: values.order_date ? values.order_date.toISOString() : null,
      total_amount: calcTotalAmount(),
      order_items: orderItems.map(({ key, ...rest }) => rest), // remove React keys
    };

    const url = order ? `/api/orders/${order.order_id}` : `/api/orders`;

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
      onSuccess && onSuccess();

      form.resetFields();
      setOrderItems([]);
    } catch (err) {
      console.error(err);
      message.error(
        err.message || "Something went wrong while submitting the form."
      );
    }
  };

  // Columns for order items table
  const orderItemColumns = [
    {
      title: "Product",
      dataIndex: "product_id",
      key: "product_id",
      render: (value, record) => (
        <Select
          showSearch
          placeholder="Select product"
          value={value}
          onChange={(val) => updateOrderItem(record.key, "product_id", val)}
          filterOption={(input, option) =>
            (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: 200 }}
        >
          {products.map((product) => (
            <Select.Option key={product.product_id} value={product.product_id}>
              {product.name}
            </Select.Option>
          ))}
        </Select>
      ),
      rules: [{ required: true, message: "Please select a product" }],
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => updateOrderItem(record.key, "quantity", val)}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => updateOrderItem(record.key, "price", val)}
          style={{ width: 120 }}
          formatter={(v) => `$ ${v}`}
          parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Total",
      key: "total",
      render: (text, record) => {
        const total = (record.quantity || 0) * (record.price || 0);
        return <span>${total.toFixed(2)}</span>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button danger size="small" onClick={() => removeOrderItem(record.key)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Form
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
      style={{ maxWidth: 700 }}
      onFinish={onFinish}
    >
      <Form.Item
        label="Client Name"
        name="client_name"
        rules={[{ required: true, message: "Client name is required" }]}
      >
        <Input placeholder="Client Name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Email is required" },
          { type: "email", message: "Enter a valid email" },
        ]}
      >
        <Input placeholder="example@email.com" />
      </Form.Item>

      <Form.Item
        label="Phone"
        name="phone"
        rules={[{ required: true, message: "Phone number is required" }]}
      >
        <Input placeholder="+1234567890" />
      </Form.Item>

      <Form.Item
        label="Shipping Address"
        name="shipping_adresse"
        rules={[{ required: true, message: "Shipping address is required" }]}
      >
        <TextArea rows={3} placeholder="Shipping Address" />
      </Form.Item>

      <Form.Item
        label="Order Date"
        name="order_date"
        rules={[{ required: true, message: "Order date is required" }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Status"
        name="status"
        rules={[{ required: true, message: "Order status is required" }]}
      >
        <Select placeholder="Select status">
          {statusOptions.map((stat) => (
            <Select.Option key={stat} value={stat}>
              {stat.charAt(0).toUpperCase() + stat.slice(1)}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Order Items" wrapperCol={{ offset: 6, span: 16 }}>
        <Button type="dashed" onClick={addOrderItem} block>
          + Add Item
        </Button>
        <Table
          dataSource={orderItems.map((item) => ({ ...item }))}
          columns={orderItemColumns}
          pagination={false}
          rowKey="key"
          style={{ marginTop: 16 }}
          locale={{ emptyText: "No order items. Please add." }}
        />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
        <Button type="primary" htmlType="submit">
          {order ? "Update Order" : "Create Order"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default OrderForm;
