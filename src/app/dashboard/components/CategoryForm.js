// app/dashboard/components/CategoryForm.js
import React, { useState, useEffect } from "react";
import { Button, Form, Input, Select } from "antd";
import FormError from "./FormError"; // Import reusable component

const { TextArea } = Input;

const CategoryForm = ({ category = null, categories = [], onSuccess }) => {
  const [form] = Form.useForm();

  // Local error state
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track category name for any reactive control if needed
  const [categoryName, setCategoryName] = useState(category?.name || "");

  // Initialize form fields when category or categories list changes
  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name || "",
        parent_category_id: category.parent_category_id || null,
        description: category.description || "",
        category_type: category.category_type || "type",
      });
      setCategoryName(category.name || "");
    } else {
      // Reset form if no category (add mode)
      form.resetFields();
      form.setFieldsValue({ category_type: "type" });
      setCategoryName("");
    }
  }, [category, form]);

  // Track name field changes
  const onValuesChange = (changedValues) => {
    if (changedValues.name !== undefined) {
      setCategoryName(changedValues.name);
    }
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = { ...values };

      const url = category
        ? `/api/categories/${category.category_id}`
        : `/api/categories`;

      const method = category ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorRes = await res.json().catch(() => ({}));
        throw new Error(errorRes.error || "API request failed");
      }

      if (onSuccess) onSuccess();

      form.resetFields();
      setCategoryName("");
    } catch (err) {
      setError(
        err.message || "Something went wrong while submitting the form."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical" // Switched to vertical to match other forms
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      className="pt-2"
    >
      {/* Reusable Error Component */}
      <FormError error={error} onClose={() => setError(null)} />

      <Form.Item
        name="name"
        label={<span className="font-medium text-gray-700">Name</span>}
        rules={[{ required: true, message: "Category name is required" }]}
      >
        <Input className="h-10 rounded-md" placeholder="Category Name" />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="parent_category_id"
          label={
            <span className="font-medium text-gray-700">Parent Category</span>
          }
          className="mb-0"
        >
          <Select
            showSearch
            allowClear
            className="h-10"
            placeholder="Select parent category"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {/* Show all categories except current one to avoid circular references */}
            {categories
              .filter(
                (cat) =>
                  cat.category_id !== (category ? category.category_id : null)
              )
              .map((cat) => (
                <Select.Option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="category_type"
          label={<span className="font-medium text-gray-700">Type</span>}
          rules={[{ required: true, message: "Category type is required" }]}
          initialValue={category?.category_type || "type"}
          className="mb-0"
        >
          <Select className="h-10">
            <Select.Option value="type">Product Type</Select.Option>
            <Select.Option value="style">Style / Occasion</Select.Option>
          </Select>
        </Form.Item>
      </div>

      <Form.Item
        name="description"
        label={
          <span className="font-medium text-gray-700 mt-4 block">
            Description
          </span>
        }
      >
        <TextArea
          rows={4}
          placeholder="Category Description (optional)"
          className="rounded-md"
        />
      </Form.Item>

      <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          className="h-10 px-6 bg-blue-600 hover:bg-blue-500 border-none shadow-sm font-medium"
        >
          {category ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </Form>
  );
};

export default CategoryForm;
