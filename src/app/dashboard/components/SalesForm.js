// app/dashboard/components/SalesForm.js
"use client";
import { useEffect, useState } from "react";
import { Form, Input, Button, DatePicker, Select, InputNumber } from "antd";
import { getProducts } from "@/lib/api";
import dayjs from "dayjs";
import FormError from "./FormError"; // Import the reusable component

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesForm = ({ sale, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const isEditing = !!sale;

  // Fetch products for multi-select on mount
  useEffect(() => {
    (async () => {
      try {
        const productsData = await getProducts();
        setProducts(
          Array.isArray(productsData)
            ? productsData
            : productsData.products || []
        );
      } catch {
        setProducts([]);
      }
    })();
  }, []);

  // Set form fields on edit
  useEffect(() => {
    if (isEditing && sale) {
      form.setFieldsValue({
        name: sale.name,
        discount_type: sale.discount_type,
        discount_value: Number(sale.discount_value),
        duration: [
          sale.start_date ? dayjs(sale.start_date) : null,
          sale.end_date ? dayjs(sale.end_date) : null,
        ],
        product_ids: sale.product_ids,
      });
    } else {
      form.resetFields();
    }
  }, [sale, form, isEditing]);

  const onFinish = async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      const [start_date, end_date] = values.duration || [];

      const payload = {
        ...values,
        start_date: start_date ? start_date.toISOString() : null,
        end_date: end_date ? end_date.toISOString() : null,
        product_ids: values.product_ids || [],
      };

      const apiEndpoint = isEditing ? `/api/sales/${sale.id}` : "/api/sales";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(apiEndpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            (isEditing ? "Failed to update sale" : "Failed to create sale")
        );
      }

      if (onSuccess) onSuccess();

      if (!isEditing) {
        form.resetFields();
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving the sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="pt-2">
      {/* Reusable Error Component */}
      <FormError error={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 gap-y-2">
        <Form.Item
          name="name"
          label={<span className="font-medium text-gray-700">Sale Name</span>}
          rules={[{ required: true, message: "Please enter a sale name" }]}
        >
          <Input
            className="h-10 rounded-md"
            placeholder="e.g., Black Friday Sale"
          />
        </Form.Item>

        {/* 2-Column Grid for Discount Type & Value */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="discount_type"
            label={
              <span className="font-medium text-gray-700">Discount Type</span>
            }
            rules={[{ required: true, message: "Required" }]}
            className="mb-0"
          >
            <Select
              placeholder="Select type"
              className="h-10"
              classNames={{ popup: { root: "rounded-lg shadow-lg" } }}
            >
              <Option value="percentage">Percentage (%)</Option>
              <Option value="fixed">Fixed Amount ($)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="discount_value"
            label={<span className="font-medium text-gray-700">Value</span>}
            rules={[
              { required: true, message: "Required" },
              { type: "number", min: 0, message: "Must be positive" },
            ]}
            className="mb-0"
          >
            <InputNumber
              placeholder="e.g. 20"
              className="h-10 w-full rounded-md flex items-center"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="duration"
          label={
            <span className="font-medium text-gray-700">Sale Duration</span>
          }
          rules={[
            { required: true, message: "Please select start and end dates" },
          ]}
        >
          <RangePicker
            showTime
            className="h-10 w-full rounded-md"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="product_ids"
          label={
            <span className="font-medium text-gray-700">Assign Products</span>
          }
        >
          <Select
            mode="multiple"
            placeholder="Search and select products"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={products.map((product) => ({
              label: product.name,
              value: product.product_id,
            }))}
            className="min-h-[40px]"
            style={{ width: "100%" }}
            maxTagCount="responsive"
          />
        </Form.Item>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          className="h-10 px-6 bg-blue-600 hover:bg-blue-500 border-none shadow-sm font-medium"
        >
          {isEditing ? "Save Changes" : "Create Sale"}
        </Button>
      </div>
    </Form>
  );
};

export default SalesForm;
