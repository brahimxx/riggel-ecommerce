import React, { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

// Allowed types & size (same as backend)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const { TextArea } = Input;

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e?.fileList || [];
};

const ProductForm = ({ product = null, categories, onSuccess }) => {
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (product && product.images) {
      setImages(product.images);
    } else {
      setImages([]);
    }
  }, [product]);

  useEffect(() => {
    if (product && categories.length > 0) {
      form.setFieldsValue({
        name: product.name || "",
        category_id: product.category_id || "",
        price: product.price || 0,
        description: product.description || "",
        images: product.images
          ? product.images.map((url, idx) => ({
              uid: `img-${idx}`,
              name: url.split("/").pop(),
              status: "done",
              url,
            }))
          : [],
      });
    } else if (!product && categories.length > 0) {
      form.resetFields();
    }
  }, [product, categories, form]);

  // Reordering handlers
  const moveImage = (from, to) => {
    setImages((imgs) => {
      const arr = [...imgs];
      const [img] = arr.splice(from, 1);
      arr.splice(to, 0, img);
      return arr;
    });
  };

  // Add uploaded image to the end
  const handleUploadSuccess = (response) => {
    setImages((imgs) => [
      ...imgs,
      {
        id: null,
        url: response.url,
        // Other metadata will be auto-filled on submit
      },
    ]);
  };

  // Pass productId to uploader, fallback to a tempId if not editing (creation)
  const getProductId = () =>
    product?.product_id || form.getFieldValue("name") || "new";

  // AntD Upload "beforeUpload" method
  const beforeUpload = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error("Only JPG, PNG, GIF, or WEBP images are allowed.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_SIZE) {
      message.error("Image must be smaller than 5MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  // Custom request so we can send productId in FormData
  const customRequest = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    try {
      const productId = getProductId();
      if (!productId)
        throw new Error("Product ID or name required before uploading images.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress({ percent: (event.loaded / event.total) * 100 });
        }
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          onError(new Error(xhr.statusText));
        } else {
          const response = JSON.parse(xhr.responseText);
          // Only use one image-appending function:
          handleUploadSuccess(response); // This is YOUR function that calls setImages
          onSuccess(response);
        }
      };

      xhr.onerror = () => {
        onError(new Error(xhr.statusText));
      };
      xhr.send(formData);
    } catch (err) {
      onError(err);
    }
  };

  // Remove image handler
  const removeImage = (idx) =>
    setImages((imgs) => imgs.filter((_, i) => i !== idx));

  const onFinish = async (values) => {
    try {
      const productName = values.name || "product";
      const payload = {
        ...values,
        images: images.map((img, idx) => ({
          ...img,
          alt_text: `Image of ${productName}`,
          is_primary: idx === 0,
          sort_order: idx,
        })),
      };
      const res = await fetch(
        product ? `/api/products/${product.product_id}` : `/api/products`,
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("API request failed");
      message.success(
        `Product ${product ? "updated" : "created"} successfully`
      );
      onSuccess && onSuccess();
      form.resetFields();
      setImages([]);
    } catch (err) {
      message.error(
        err.message || "Something went wrong while submitting the form."
      );
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
        name="category_id"
        label="Category"
        rules={[{ required: true, message: "Select a category" }]}
      >
        <Select placeholder="Select a category">
          {categories
            .filter((cat) => cat.category_id != null)
            .map((cat) => (
              <Select.Option key={cat.category_id} value={cat.category_id}>
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
      <Form.Item label="Images">
        <Upload
          listType="picture-card"
          showUploadList={false}
          customRequest={customRequest}
          beforeUpload={beforeUpload}
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
        >
          <button type="button" style={{ border: 0, background: "none" }}>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        </Upload>
        {/* Render uploaded images with reordering UI */}
        <div style={{ marginTop: 16 }}>
          {images.map((img, idx) => (
            <div
              key={(img.id ?? img.url) + "-" + idx}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
                gap: 10,
              }}
            >
              <img
                src={img.url}
                alt={`Image of ${form.getFieldValue("name") || "product"}`}
                style={{ width: 90, height: 90, objectFit: "cover" }}
              />
              <span style={{ width: 130 }}>
                {idx === 0 && (
                  <span style={{ color: "green" }}>Main Image</span>
                )}
              </span>
              <Button
                size="small"
                disabled={idx === 0}
                onClick={() => moveImage(idx, idx - 1)}
              >
                ↑
              </Button>
              <Button
                size="small"
                disabled={idx === images.length - 1}
                onClick={() => moveImage(idx, idx + 1)}
              >
                ↓
              </Button>
              <Button danger size="small" onClick={() => removeImage(idx)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
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
