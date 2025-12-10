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
  Divider,
} from "antd";
import dayjs from "dayjs";
import FormError from "./FormError"; // Import reusable component

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

  // Error & Loading State
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a flattened list of all variants
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
        note: order.note || "", // <--- Pre-fill Note
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
    setError(null);
    setIsSubmitting(true);

    try {
      if (orderItems.length === 0) {
        throw new Error("At least one order item is required");
      }

      for (const item of orderItems) {
        if (!item.variant_id) {
          throw new Error("All order items must have a variant selected");
        }
        const variant = variantsList.find(
          (v) => v.variant_id === item.variant_id
        );
        if (!variant) {
          throw new Error(`Variant with ID ${item.variant_id} not found.`);
        }

        const originalItem = order?.order_items?.find(
          (oi) => oi.variant_id === item.variant_id
        );
        const reservedQty = originalItem ? originalItem.quantity : 0;
        const effectiveAvailable = variant.quantity + reservedQty;

        if (item.quantity > effectiveAvailable) {
          throw new Error(
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
        note: values.note, // <--- Include Note in Payload (auto included via ...values, explicit here for clarity)
      };

      const url = order ? `/api/orders/${order.order_id}` : "/api/orders";
      const method = order ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "API request failed");
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Error submitting order.");
    } finally {
      setIsSubmitting(false);
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
    <Form form={form} layout="vertical" onFinish={onFinish} className="pt-2">
      {/* Global Error Alert */}
      <FormError error={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label={<span className="font-medium text-gray-700">Client Name</span>}
          name="client_name"
          rules={[{ required: true }]}
        >
          <Input className="h-10 rounded-md" placeholder="Client Name" />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Email</span>}
          name="email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input className="h-10 rounded-md" placeholder="Email Address" />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Phone</span>}
          name="phone"
          rules={[{ required: true }]}
        >
          <Input className="h-10 rounded-md" placeholder="Phone Number" />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Status</span>}
          name="status"
          rules={[{ required: true }]}
        >
          <Select
            className="h-10"
            placeholder="Select Status"
            options={statusOptions.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Order Date</span>}
          name="order_date"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} className="h-10 rounded-md" />
        </Form.Item>
      </div>

      {/* Shipping Address & Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label={
            <span className="font-medium text-gray-700">Shipping Address</span>
          }
          name="shipping_address"
          rules={[{ required: true }]}
        >
          <TextArea
            rows={3}
            className="rounded-md"
            placeholder="Full shipping address"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Order Note</span>}
          name="note"
        >
          <TextArea
            rows={3}
            className="rounded-md"
            placeholder="Customer notes or special instructions..."
          />
        </Form.Item>
      </div>

      <Divider
        orientation="left"
        className="!border-gray-200 !text-gray-500 !text-sm uppercase !font-bold !mt-8"
      >
        Order Items
      </Divider>

      <Button
        onClick={addOrderItem}
        type="dashed"
        block
        style={{ marginBottom: 16 }}
        className="border-gray-300 text-gray-500 "
      >
        + Add Product Item
      </Button>

      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <Table
          dataSource={orderItems}
          columns={orderItemColumns}
          pagination={false}
          rowKey="key"
          size="small"
          locale={{ emptyText: "No items added yet" }}
        />
      </div>

      <div
        style={{ textAlign: "right", marginTop: "24px", fontSize: "1.2em" }}
        className="bg-gray-50 p-4 rounded-lg border border-gray-100"
      >
        <span className="text-gray-500 mr-2 text-base">Total Amount:</span>
        <strong className="text-2xl text-green-800">
          ${calcTotalAmount().toFixed(2)}
        </strong>
      </div>

      <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          className="h-10 px-8 font-medium rounded-md shadow-sm border-none"
        >
          {order ? "Update Order" : "Create Order"}
        </Button>
      </div>
    </Form>
  );
};

export default OrderForm;
