import React, { useState, useEffect } from "react";
import { Button, Form, Input, Select, message } from "antd";

const { TextArea } = Input;

const CategoryForm = ({ category = null, categories = [], onSuccess }) => {
  const [form] = Form.useForm();

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
      form.setFieldsValue({ category_type: "type" }); // Set default on reset
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
    try {
      const payload = {
        ...values,
      };

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

      message.success(
        `Category ${category ? "updated" : "created"} successfully`
      );
      onSuccess && onSuccess();

      form.resetFields();
      setCategoryName("");
    } catch (err) {
      console.error(err);
      message.error(
        err.message || "Something went wrong while submitting the form."
      );
    }
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: "Category name is required" }]}
      >
        <Input placeholder="Category Name" />
      </Form.Item>

      <Form.Item name="parent_category_id" label="Parent Category">
        <Select
          showSearch
          allowClear
          placeholder="Select parent category"
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
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

      <Form.Item name="description" label="Description">
        <TextArea rows={4} placeholder="Category Description (optional)" />
      </Form.Item>
      <Form.Item
        name="category_type"
        label="Type"
        rules={[{ required: true, message: "Category type is required" }]}
        initialValue={category?.category_type || "type"}
      >
        <Select>
          <Select.Option value="type">Product Type</Select.Option>
          <Select.Option value="style">Style / Occasion</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
        <Button type="primary" htmlType="submit">
          {category ? "Update Category" : "Create Category"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CategoryForm;
