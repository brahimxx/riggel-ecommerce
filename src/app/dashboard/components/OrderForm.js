import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Table,
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

  // For generating unique keys for new order items (client-only before saved)
  const [tempIdCounter, setTempIdCounter] = useState(0);

  // Order items state with keys (order_item_id or temp keys)
  const [orderItems, setOrderItems] = useState([]);

  // Initialize form and order items on order load/change
  useEffect(() => {
    if (order && order.order_items) {
      const itemsWithKeys = order.order_items.map((item) => ({
        ...item,
        key: item.order_item_id.toString(), // use DB id as key
      }));
      setOrderItems(itemsWithKeys);

      form.setFieldsValue({
        client_name: order.client_name || "",
        email: order.email || "",
        phone: order.phone || "",
        shipping_address: order.shipping_address || "",
        order_date: order.order_date ? dayjs(order.order_date) : null,
        status: order.status || "pending",
        total_amount: order.total_amount ?? 0,
      });
    } else {
      form.resetFields();
      setOrderItems([]);
    }
    // reset tempIdCounter for new items if you want
    setTempIdCounter(0);
  }, [order, form]);

  // Add new order item with temporary key
  const addOrderItem = () => {
    setTempIdCounter((prev) => prev + 1);
    setOrderItems((items) => [
      ...items,
      {
        key: `temp-${tempIdCounter + 1}`,
        product_id: null,
        quantity: 1,
        price: 0,
      },
    ]);
  };

  // Remove order item by key
  const removeOrderItem = (key) => {
    setOrderItems((items) => items.filter((item) => item.key !== key));
  };

  // Update order item field by key
  const updateOrderItem = (key, field, value) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  // Submit handler
  const onFinish = async (values) => {
    if (orderItems.length === 0) {
      message.error("At least one order item is required");
      return;
    }

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
      const product = products.find((p) => p.product_id === item.product_id);
      if (product) {
        // Find previous reserved quantity for this product in the order
        const originalItem = order?.order_items?.find(
          (oi) => oi.product_id === item.product_id
        );
        const reservedQty = originalItem ? originalItem.quantity : 0;

        // Effective available stock is current stock + reserved quantity
        const effectiveAvailable = product.quantity + reservedQty;

        if (item.quantity > effectiveAvailable) {
          message.error(
            `Not enough stock for "${product.name}". Available: ${effectiveAvailable}, requested: ${item.quantity}`
          );
          return;
        }
      }
    }

    const sanitizedOrderItems = orderItems.map((item) => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const payload = {
      ...values,
      order_date: values.order_date ? values.order_date.toISOString() : null,
      total_amount: calcTotalAmount(),
      order_items: sanitizedOrderItems.map(({ key, ...rest }) => rest), // omit React keys
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
      onSuccess && onSuccess();

      form.resetFields();
      setOrderItems([]);
      setTempIdCounter(0);
    } catch (err) {
      console.error(err);
      message.error(err.message || "Error submitting order.");
    }
  };

  // Table columns as you already have
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
          onChange={(val) => {
            updateOrderItem(record.key, "product_id", val);

            // Find selected product price
            const selectedProduct = products.find((p) => p.product_id === val);
            if (selectedProduct) {
              // Update the price for the same order item
              updateOrderItem(record.key, "price", selectedProduct.price);
            } else {
              // Optionally reset price if product not found
              updateOrderItem(record.key, "price", 0);
            }
          }}
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
    },
    ,
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value, record) => {
        // Find the selected product for this row
        const selectedProduct = products.find(
          (p) => p.product_id === record.product_id
        );

        return (
          <InputNumber
            min={1}
            value={value}
            onChange={(val) => {
              updateOrderItem(record.key, "quantity", val);
            }}
            style={{ width: 100 }}
          />
        );
      },
    },
    ,
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
      render: (_, record) => {
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

  const calcTotalAmount = () =>
    orderItems.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );

  useEffect(() => {
    form.setFieldsValue({ total_amount: calcTotalAmount() });
  }, [orderItems, form]);

  return (
    <Form
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
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
        name="shipping_address"
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

      <Form.Item
        labelCol={{ span: 0 }}
        wrapperCol={{ span: 24 }}
        colon={false}
        className="!mb-0 w-full"
      >
        <div className="flex flex-col w-full">
          <span className="font-semibold mb-2 pl-1">Order Items</span>
          <Button
            type="dashed"
            onClick={addOrderItem}
            className="mb-3 max-w-xs"
          >
            + Add Item
          </Button>
          <div className="rounded border border-gray-200 bg-gray-50 overflow-x-auto overflow-y-auto max-h-80 p-0">
            <Table
              dataSource={orderItems}
              columns={orderItemColumns}
              pagination={false}
              rowKey="key"
              size="small"
              scroll={{ x: "max-content", y: 280 }}
              style={{ minWidth: 600 }}
              locale={{ emptyText: "No order items. Please add." }}
            />
          </div>
        </div>
      </Form.Item>

      <div className="w-full flex !justify-end items-center mt-5 px-6">
        <Form.Item label="Total " wrapperCol={{ offset: 6, span: 16 }}>
          <InputNumber
            value={calcTotalAmount()}
            disabled
            formatter={(value) => `$ ${Number(value || 0).toFixed(2)}`}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>
      </div>

      <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
        <Button type="primary" htmlType="submit">
          {order ? "Update Order" : "Create Order"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default OrderForm;
