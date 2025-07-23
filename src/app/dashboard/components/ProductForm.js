import React, { useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select, Upload } from "antd";

const { TextArea } = Input;

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e?.fileList || [];
};

const ProductForm = ({ product = null, categories }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (product && categories.length > 0) {
      form.setFieldsValue({
        name: product.name || "",
        category: product.category_id || "", // must be number/string that matches Select value
        price: product.price || 0,
        description: product.description || "",
        images: product.images || [],
      });
    } else if (!product) {
      form.resetFields();
    }
  }, [product, categories, form]);

  const onFinish = async (values) => {
    try {
      const res = await fetch(
        product ? `/api/products/${product.id}` : `/api/products`,
        {
          method: product ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        throw new Error("API request failed");
      }

      message.success(
        `Product ${product ? "updated" : "created"} successfully`
      );

      if (onSuccess) onSuccess(); // Notify parent

      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Something went wrong while submitting the form.");
    }
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
      onFinish={onFinish}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: "Product name is required" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: "Select a category" }]}
      >
        <Select placeholder="Select a category">
          {categories.map((cat) => (
            <Select.Option key={cat.id} value={cat.id}>
              {cat.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: "Price is required" }]}
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item
        name="images"
        label="Images"
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Upload action="/upload.do" listType="picture-card">
          <button type="button" style={{ border: 0, background: "none" }}>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        </Upload>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4, span: 14 }}>
        <Button type="primary" htmlType="submit">
          {product ? "Update Product" : "Create Product"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
