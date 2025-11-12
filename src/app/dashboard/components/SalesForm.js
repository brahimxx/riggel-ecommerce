"use client";
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  message,
  InputNumber,
} from "antd";
import { getProducts } from "@/lib/api"; // You’ll need to create this helper
import moment from "moment";

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesForm = ({ sale, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const isEditing = !!sale;

  // Fetch products for multi-select on mount
  useEffect(() => {
    (async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData.products || []);
      } catch {
        setProducts([]);
      }
    })();
  }, []);

  console.log("Products for SalesForm:", products);
  // Set form fields on edit
  useEffect(() => {
    if (isEditing && sale) {
      form.setFieldsValue({
        name: sale.name,
        discount_type: sale.discount_type,
        discount_value: Number(sale.discount_value),
        duration: [
          sale.start_date && moment(sale.start_date),
          sale.end_date && moment(sale.end_date),
        ],
        product_ids: sale.product_ids, // Array of product IDs assigned to sale
      });
    } else {
      form.resetFields();
    }
  }, [sale, form, isEditing]);

  const onFinish = (values) => {
    setSubmitting(true);
    const [start_date, end_date] = values.duration;
    // Compose payload
    const payload = {
      ...values,
      start_date,
      end_date,
      product_ids: values.product_ids || [],
    };

    const apiEndpoint = isEditing ? `/api/sales/${sale.id}` : "/api/sales";
    const method = isEditing ? "PUT" : "POST";

    fetch(apiEndpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            isEditing ? "Failed to update sale" : "Failed to create sale"
          );
        return res.json();
      })
      .then(() => {
        message.success(
          `Sale ${isEditing ? "updated" : "added"} successfully!`
        );
        onSuccess();
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="name" label="Sale Name" rules={[{ required: true }]}>
        <Input placeholder="e.g., Black Friday Sale" />
      </Form.Item>
      <Form.Item
        name="discount_type"
        label="Discount Type"
        rules={[{ required: true }]}
      >
        <Select placeholder="Choose discount type">
          <Option value="percentage">Percentage</Option>
          <Option value="fixed">Fixed Amount</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="discount_value"
        label="Discount Value"
        valuePropName="value"
        rules={[
          { required: true, message: "Discount value is required!" },
          {
            type: "number",
            min: 0,
            transform: (value) => (value === "" ? undefined : value),
          },
        ]}
      >
        <InputNumber placeholder="e.g., 20" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="duration"
        label="Sale Duration"
        rules={[{ required: true }]}
      >
        <RangePicker showTime />
      </Form.Item>
      <Form.Item name="product_ids" label="Assign Products">
        <Select
          mode="multiple"
          placeholder="Search and select products"
          showSearch
          filterOption={false} // Turn off local filtering
          onSearch={async (value) => {
            // Call API with query param
            const data = await getProducts({ query: value, limit: 10 });
            setProducts(data.products || []);
          }}
          options={products.map((product) => ({
            label: product.name,
            value: product.product_id,
          }))}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {isEditing ? "Update Sale" : "Add Sale"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SalesForm;
