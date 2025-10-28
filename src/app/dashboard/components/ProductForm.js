// app/dashboard/components/ProductForm.js
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
  Space,
  Divider,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

// (Keep your ALLOWED_IMAGE_TYPES and MAX_SIZE constants)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024;

const { TextArea } = Input;

const ProductForm = ({ product = null, categories, onSuccess }) => {
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const PRODUCT_IMAGE_VALUE = "product";
  const [uploadProgress, setUploadProgress] = useState(null);
  const [productName, setProductName] = useState(product?.name || "");
  const [attributes, setAttributes] = useState([]);

  // Fetch all attributes and their values for variants
  useEffect(() => {
    fetch("/api/attributes")
      .then((res) => res.json())
      .then((data) => setAttributes(data))
      .catch(() => setAttributes([]));
  }, []);

  // Set initial form values, including variants
  useEffect(() => {
    if (product) {
      // Transform variant attributes array to object for AntD Form
      const variants = (product.variants || []).map((v) => ({
        ...v,
        attributes: Array.isArray(v.attributes)
          ? v.attributes.reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          : v.attributes || {},
      }));

      // MODIFICATION: Set 'category_ids' from the product's 'categories' array
      form.setFieldsValue({
        ...product,
        category_ids: product.categories
          ? product.categories.map((c) => c.category_id)
          : [],
        variants,
      });
      setImages(product.images || []);
      setProductName(product.name || "");
      // Set variant options for image assignment
      setVariantOptions(
        (product.variants || []).map((v) => ({
          label: v.sku || `Variant ${v.variant_id}`,
          value: v.variant_id,
        }))
      );
    } else {
      form.resetFields();
      form.setFieldsValue({ variants: [{}] }); // Start with one empty variant
      setImages([]);
      setProductName("");
      setVariantOptions([]);
    }
  }, [product, form]);

  const onValuesChange = (changedValues) => {
    if (changedValues.name !== undefined) {
      setProductName(changedValues.name);
    }
  };

  // --- All your image handling functions (customRequest, beforeUpload, etc.) remain unchanged ---
  const getProductId = () => product?.product_id || productName || "new";
  const handleUploadSuccess = (response) => {
    setImages((imgs) => [
      ...imgs,
      {
        id: null,
        url: response.url,
        alt_text: "",
        sort_order: imgs.length,
        is_primary: imgs.length === 0,
        variant_id: null,
      },
    ]);
  };
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
  const removeImage = (idx) =>
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  const moveImage = (from, to) => {
    setImages((imgs) => {
      const arr = [...imgs];
      const [img] = arr.splice(from, 1);
      arr.splice(to, 0, img);
      return arr;
    });
  };

  const onFinish = async (values) => {
    try {
      const variants = (values.variants || []).map((variant) => {
        const attrs = attributes.map((attr) => ({
          name: attr.name,
          value: variant.attributes?.[attr.name] || "",
        }));
        return {
          ...variant,
          attributes: attrs,
        };
      });

      // MODIFICATION: The 'category_ids' field from the form is now used directly.
      const payload = {
        ...values, // This will include 'name', 'description', and 'category_ids'
        variants,
        images: images.map((img, idx) => ({
          ...img,
          alt_text: `Image of ${values.name}`,
          is_primary: idx === 0,
          sort_order: idx,
          variant_id: img.variant_id || null,
        })),
      };

      // The API now expects `category_ids` instead of `category_id`.
      // Since the form field is named `category_ids`, we don't need to do anything extra here.
      delete payload.category_id; // Clean up any lingering old field, just in case.

      const url = product
        ? `/api/products/by-id/${product.product_id}`
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
      onSuccess?.();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Something went wrong.");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input placeholder="Product Name" />
      </Form.Item>

      {/* MODIFICATION: Updated to a multi-select for categories */}
      <Form.Item
        name="category_ids"
        label="Categories"
        rules={[
          { required: true, message: "Please select at least one category." },
        ]}
      >
        <Select
          mode="multiple"
          allowClear
          placeholder="Select categories"
          filterOption={(input, option) =>
            (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
          }
        >
          {categories.map((cat) => (
            <Select.Option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={4} />
      </Form.Item>

      <Divider>Variants</Divider>

      <Form.List name="variants">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{
                  display: "flex",
                  marginBottom: 8,
                  border: "1px dashed #ccc",
                  padding: "12px",
                  flexWrap: "wrap",
                }}
                align="baseline"
              >
                <Form.Item
                  {...restField}
                  name={[name, "sku"]}
                  label="SKU"
                  style={{ flex: 1 }}
                >
                  <Input placeholder="SKU" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "price"]}
                  label="Price"
                  rules={[{ required: true }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "quantity"]}
                  label="Quantity"
                  rules={[{ required: true }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
                {/* Attribute dropdowns for each attribute */}
                {attributes.map((attr) => (
                  <Form.Item
                    key={attr.attribute_id}
                    name={[name, "attributes", attr.name]}
                    label={attr.name}
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: `Select ${attr.name}` }]}
                  >
                    <Select placeholder={`Select ${attr.name}`}>
                      {attr.values.map((val) => (
                        <Select.Option key={val.value_id} value={val.value}>
                          {val.value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                ))}
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add Variant
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider>Images</Divider>

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
            <PlusOutlined /> <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        </Upload>
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
              <Select
                style={{ width: 160 }}
                value={
                  img.variant_id === null || img.variant_id === undefined
                    ? PRODUCT_IMAGE_VALUE
                    : img.variant_id
                }
                onChange={(val) => {
                  setImages((images) =>
                    images.map((im, i) =>
                      i === idx
                        ? {
                            ...im,
                            variant_id:
                              val === PRODUCT_IMAGE_VALUE ? null : val,
                          }
                        : im
                    )
                  );
                }}
                placeholder="Assign to Variant"
              >
                <Select.Option value={PRODUCT_IMAGE_VALUE}>
                  Product (All Variants)
                </Select.Option>
                {variantOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
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

      <Form.Item>
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
