import React, { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Progress,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

// Allowed image types and max size (5MB)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const { TextArea } = Input;

const ProductForm = ({ product = null, categories, onSuccess }) => {
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);

  // Upload progress as percentage
  const [uploadProgress, setUploadProgress] = useState(null);

  // Track productName to control Upload disabled state
  const [productName, setProductName] = useState(product?.name || "");

  // Initialize images state when product changes
  useEffect(() => {
    if (product && product.images) {
      setImages(product.images);
    } else {
      setImages([]);
    }
  }, [product]);

  // Initialize other form fields (without images)
  useEffect(() => {
    if (product && categories.length > 0) {
      form.setFieldsValue({
        name: product.name || "",
        category_id: product.category_id || "",
        price: product.price || 0,
        quantity: product.quantity ?? 0,
        description: product.description || "",
        rating: typeof product.rating === "number" ? product.rating : 0,
      });
      setProductName(product.name || "");
    } else if (!product && categories.length > 0) {
      form.resetFields();
      setProductName("");
    }
  }, [product, categories, form]);

  // Update productName state when form values change
  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.name !== undefined) {
      setProductName(changedValues.name);
    }
  };

  // Helper: get productId or fallback
  const getProductId = () => product?.product_id || productName || "new";

  // Upload validation
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

  // Add uploaded image to images state once
  const handleUploadSuccess = (response) => {
    setImages((imgs) => [
      ...imgs,
      {
        id: null,
        url: response.url,
        alt_text: "",
        sort_order: imgs.length,
        is_primary: imgs.length === 0, // first image is primary by default
      },
    ]);
  };

  // Upload handler: send productId along with file
  const customRequest = (options) => {
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
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
          onProgress({ percent });
        }
      };

      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status < 200 || xhr.status >= 300) {
          onError(new Error(xhr.statusText));
          return;
        }
        const response = JSON.parse(xhr.responseText);
        handleUploadSuccess(response);
        onSuccess(response);
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        onError(new Error(xhr.statusText));
      };

      xhr.send(formData);
    } catch (err) {
      onError(err);
      setUploadProgress(null);
    }
  };

  // Remove image from state by index
  const removeImage = (idx) =>
    setImages((imgs) => imgs.filter((_, i) => i !== idx));

  // Reorder images: move from one index to another
  const moveImage = (from, to) => {
    setImages((imgs) => {
      const arr = [...imgs];
      const [img] = arr.splice(from, 1);
      arr.splice(to, 0, img);
      return arr;
    });
  };

  // Form submit handler
  const onFinish = async (values) => {
    try {
      const productNameFinal = values.name || "product";
      const payload = {
        ...values,
        images: images.map((img, idx) => ({
          ...img,
          alt_text: `Image of ${productNameFinal}`,
          is_primary: idx === 0,
          sort_order: idx,
        })),
      };

      const url = product
        ? `/api/products/${product.product_id}`
        : `/api/products`;

      const res = await fetch(url, {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorRes = await res.json().catch(() => ({}));
        throw new Error(errorRes.error || "API request failed");
      }

      message.success(
        `Product ${product ? "updated" : "created"} successfully`
      );
      onSuccess && onSuccess();

      // Reset form and images
      form.resetFields();
      setImages([]);
      setProductName("");
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
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      style={{ maxWidth: 800 }}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: "Product name is required" }]}
      >
        <Input placeholder="Product Name" />
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
      <Form.Item
        name="quantity"
        label="Quantity"
        rules={[
          { required: true, message: "Quantity is required" },
          {
            type: "number",
            min: 0,
            message: "Quantity must be zero or more",
          },
        ]}
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <TextArea rows={4} placeholder="Product Description" />
      </Form.Item>
      <Form.Item
        name="rating"
        label="Rating"
        rules={[
          { type: "number", min: 0, max: 5, message: "Rating must be 0–5" },
        ]}
      >
        <InputNumber
          min={0}
          max={5}
          step={0.1}
          precision={1}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item label="Images">
        <Upload
          listType="picture-card"
          showUploadList={false}
          customRequest={customRequest}
          beforeUpload={beforeUpload}
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          disabled={!productName && !product?.product_id}
        >
          <button
            type="button"
            style={{ border: 0, background: "none" }}
            disabled={!productName && !product?.product_id}
          >
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        </Upload>
        {!productName && !product?.product_id && (
          <div style={{ color: "#faad14", marginTop: 6 }}>
            Please enter a product name before uploading images.
          </div>
        )}
        {uploadProgress !== null && (
          <div style={{ marginTop: 8 }}>
            <Progress percent={Math.round(uploadProgress)} size="small" />
          </div>
        )}
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
                alt={`Image of ${
                  form.getFieldValue("name") || product?.name || "product"
                }`}
                style={{ width: 90, height: 90, objectFit: "cover" }}
              />
              <span style={{ width: 130 }}>
                {idx === 0 && (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    Main Image
                  </span>
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
        <Button
          type="primary"
          htmlType="submit"
          disabled={uploadProgress !== null}
        >
          {product ? "Update Product" : "Create Product"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
