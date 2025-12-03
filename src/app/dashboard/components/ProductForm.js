// app/dashboard/components/ProductForm.js
import React, { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Form,
  Input,
  InputNumber,
  Select,
  App,
  Progress,
  Space,
  Divider,
  Alert,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const { TextArea } = Input;

const ProductForm = ({ product = null, categories, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // Files waiting to be uploaded
  const [deletedImageUrls, setDeletedImageUrls] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const PRODUCT_IMAGE_VALUE = "product";
  const [uploadProgress, setUploadProgress] = useState(null);
  const [productName, setProductName] = useState(product?.name || "");
  const [attributes, setAttributes] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { message } = App.useApp();

  // Fetch all attributes and their values for variants
  useEffect(() => {
    fetch("/api/attributes")
      .then((res) => res.json())
      .then((data) => setAttributes(data))
      .catch(() => setAttributes([]));
  }, []);

  // Helper function to create variant option from variant data
  const createVariantOption = (variant, index) => {
    if (!variant) {
      return {
        label: `Variant ${index + 1}`,
        value: `temp-${index}`,
        index: index,
      };
    }

    const attributes = Array.isArray(variant.attributes)
      ? variant.attributes.reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      : variant.attributes || {};

    const variantForLabel = {
      sku: variant.sku,
      variant_id: variant.variant_id,
      attributes: attributes,
    };

    return {
      label: generateVariantLabel(variantForLabel, index),
      value: variant.variant_id ? Number(variant.variant_id) : `temp-${index}`,
      index: index,
    };
  };

  const generateVariantLabel = (variant, index) => {
    if (!variant) {
      return `Variant ${index + 1}`;
    }

    if (variant.sku && typeof variant.sku === "string" && variant.sku.trim()) {
      return variant.sku;
    }

    if (variant.attributes && typeof variant.attributes === "object") {
      const attrLabels = Object.entries(variant.attributes)
        .filter(([_, value]) => value && value !== "")
        .map(([key, value]) => value)
        .join(" / ");

      if (attrLabels) {
        return attrLabels;
      }
    }

    return `Variant ${index + 1}`;
  };

  const updateVariantOptions = () => {
    try {
      const formVariants = form.getFieldValue("variants");

      if (!Array.isArray(formVariants) || formVariants.length === 0) {
        setVariantOptions([]);
        return;
      }

      const options = formVariants.map((variant, index) =>
        createVariantOption(variant, index)
      );

      setVariantOptions(options);
    } catch (error) {
      console.error("Error updating variant options:", error);
      setVariantOptions([]);
    }
  };

  // Set initial form values, including variants
  useEffect(() => {
    if (product) {
      const variants = (product.variants || []).map((v) => ({
        ...v,
        attributes: Array.isArray(v.attributes)
          ? v.attributes.reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          : v.attributes || {},
      }));

      form.setFieldsValue({
        ...product,
        category_ids: product.categories
          ? product.categories.map((c) => c.category_id)
          : [],
        variants,
      });

      // Load images and ensure variant_id is a number (or null)
      const loadedImages = (product.images || []).map((img) => {
        const variantId = img.variant_id ? Number(img.variant_id) : null;

        return {
          id: img.id,
          url: img.url,
          filename: img.filename || null,
          originalName: img.original_filename || img.originalName || null,
          mimeType: img.mime_type || img.mimeType || null,
          size: img.size || null,
          alt_text: img.alt_text || "",
          sort_order: img.sort_order || 0,
          is_primary: img.is_primary || false,
          variant_id: variantId,
          isPending: false, // Already uploaded
        };
      });

      setImages(loadedImages);
      setProductName(product.name || "");

      // Use createVariantOption for consistent labels
      const options = (product.variants || []).map((v, index) =>
        createVariantOption(v, index)
      );

      setVariantOptions(options);
    } else {
      form.resetFields();
      form.setFieldsValue({ variants: [{}] });
      setImages([]);
      setProductName("");
      setVariantOptions([]);

      setTimeout(() => updateVariantOptions(), 0);
    }
  }, [product, form]);

  const onValuesChange = (changedValues) => {
    if (changedValues.name !== undefined) {
      setProductName(changedValues.name);
    }

    if (changedValues.variants !== undefined) {
      updateVariantOptions();
    }
  };

  const getProductId = () => product?.product_id || productName || "new";

  // Upload a single file to server
  const uploadFileToServer = async (file, productId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return await response.json();
  };

  // Handle file selection (no upload yet, just preview)
  const beforeUpload = (file) => {
    setUploadError(null);

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const error = "Only JPG, PNG, GIF, or WEBP images are allowed.";
      setUploadError(error);
      return Upload.LIST_IGNORE;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const error = `Image is too large (${sizeMB}MB). Maximum size is 5MB.`;
      setUploadError(error);
      return Upload.LIST_IGNORE;
    }

    // Create preview URL using browser's File API
    const previewUrl = URL.createObjectURL(file);

    // Add to pending files and images state
    setPendingFiles((prev) => [...prev, file]);
    setImages((imgs) => [
      ...imgs,
      {
        id: null,
        url: previewUrl, // Browser preview URL
        file: file, // Keep reference to File object
        isPending: true, // Mark as not yet uploaded
        filename: null,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        alt_text: "",
        sort_order: imgs.length,
        is_primary: imgs.length === 0,
        variant_id: null,
      },
    ]);

    return false; // Prevent automatic upload
  };

  const removeImage = (idx) => {
    const removedImage = images[idx];

    // Revoke object URL to free memory (for pending images)
    if (removedImage.isPending && removedImage.url) {
      URL.revokeObjectURL(removedImage.url);
    }

    // NEW: Track deleted image URLs for cleanup (for already uploaded images)
    if (!removedImage.isPending && removedImage.url) {
      setDeletedImageUrls((prev) => [...prev, removedImage.url]);
    }

    setImages((imgs) => imgs.filter((_, i) => i !== idx));
    setPendingFiles((files) => files.filter((_, i) => i !== idx));
  };

  const moveImage = (from, to) => {
    setImages((imgs) => {
      const arr = [...imgs];
      const [img] = arr.splice(from, 1);
      arr.splice(to, 0, img);
      return arr.map((image, index) => ({
        ...image,
        sort_order: index,
        is_primary: index === 0,
      }));
    });
  };

  // Upload all pending files before submitting
  const uploadAllPendingFiles = async (productId) => {
    const uploadedImages = [];
    let uploadedCount = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (img.isPending && img.file) {
        try {
          setUploadProgress((uploadedCount / images.length) * 100);

          const response = await uploadFileToServer(img.file, productId);

          uploadedImages.push({
            url: response.url,
            filename: response.filename,
            originalName: response.originalName,
            mimeType: response.mimeType,
            size: response.size,
            alt_text: img.alt_text,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
            variant_id: img.variant_id,
            variant_index:
              typeof img.variant_id === "string" &&
              img.variant_id.startsWith("temp-")
                ? parseInt(img.variant_id.replace("temp-", ""))
                : null,
          });

          uploadedCount++;
        } catch (error) {
          throw new Error(
            `Failed to upload ${img.originalName}: ${error.message}`
          );
        }
      } else {
        // Already uploaded (editing existing product)
        let variantId = img.variant_id;
        let variantIndex = null;

        if (typeof variantId === "string" && variantId.startsWith("temp-")) {
          variantIndex = parseInt(variantId.replace("temp-", ""));
          variantId = null;
        }

        uploadedImages.push({
          url: img.url,
          filename: img.filename,
          originalName: img.originalName,
          mimeType: img.mimeType,
          size: img.size,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
          variant_id: variantId,
          variant_index: variantIndex,
        });
      }
    }

    setUploadProgress(null);
    return uploadedImages;
  };

  const onFinish = async (values) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (images.length === 0) {
        message?.warning("Please upload at least one product image.");
        return;
      }

      const productId = getProductId();

      // Upload all pending images first
      if (pendingFiles.length > 0) {
        message?.loading("Uploading images...");
      }
      const uploadedImages = await uploadAllPendingFiles(productId);
      message?.destroy();

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

      const payload = {
        ...values,
        variants,
        images: uploadedImages,
      };

      // Only include deletedImages when editing (not when creating)
      if (product && deletedImageUrls.length > 0) {
        payload.deletedImages = deletedImageUrls;
      }

      delete payload.category_id;

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

      // Clean up preview URLs
      images.forEach((img) => {
        if (img.isPending && img.url) {
          URL.revokeObjectURL(img.url);
        }
      });

      // Clear deleted images tracking
      setDeletedImageUrls([]);

      message?.success(
        `Product ${product ? "updated" : "created"} successfully`
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      message?.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URLs
    images.forEach((img) => {
      if (img.isPending && img.url) {
        URL.revokeObjectURL(img.url);
      }
    });

    setImages([]);
    setPendingFiles([]);
    setDeletedImageUrls([]); // NEW: Clear deleted images
    setUploadError(null);
    form.resetFields();

    if (onCancel) onCancel();
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
                  <Input
                    placeholder="SKU (auto-generated if empty)"
                    onChange={() => updateVariantOptions()}
                  />
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
                {attributes.map((attr) => (
                  <Form.Item
                    key={attr.attribute_id}
                    name={[name, "attributes", attr.name]}
                    label={attr.name}
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: `Select ${attr.name}` }]}
                  >
                    <Select
                      placeholder={`Select ${attr.name}`}
                      onChange={() => updateVariantOptions()}
                    >
                      {attr.values.map((val) => (
                        <Select.Option key={val.value_id} value={val.value}>
                          {val.value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                ))}
                <MinusCircleOutlined
                  onClick={() => {
                    remove(name);
                    setTimeout(() => updateVariantOptions(), 0);
                  }}
                />
              </Space>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => {
                  add();
                  setTimeout(() => updateVariantOptions(), 0);
                }}
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
          beforeUpload={beforeUpload}
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          disabled={(!productName && !product?.product_id) || isSubmitting}
        >
          <button
            type="button"
            style={{ border: 0, background: "none" }}
            disabled={(!productName && !product?.product_id) || isSubmitting}
          >
            <PlusOutlined />{" "}
            <div style={{ marginTop: 8 }}>
              {isSubmitting ? "Uploading..." : "Select Images"}
            </div>
          </button>
        </Upload>

        {!productName && !product?.product_id && (
          <div style={{ color: "#999", fontSize: "12px", marginTop: 4 }}>
            Enter a product name first to enable image selection
          </div>
        )}

        {uploadError && (
          <Alert
            message="Upload Error"
            description={uploadError}
            type="error"
            showIcon
            closable
            onClose={() => setUploadError(null)}
            style={{ marginTop: 8 }}
          />
        )}

        {uploadProgress !== null && (
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={Math.round(uploadProgress)}
              size="small"
              status="active"
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
              Uploading images... Please wait.
            </div>
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
                padding: 10,
                border: "1px solid #f0f0f0",
                borderRadius: 4,
                backgroundColor: img.isPending ? "#fffbe6" : "transparent",
              }}
            >
              <img
                src={img.url}
                alt={img.originalName || `Image ${idx + 1}`}
                style={{
                  width: 90,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {idx === 0 && (
                    <span style={{ color: "green" }}>★ Main Image</span>
                  )}
                  {idx > 0 && `Image ${idx + 1}`}
                  {img.isPending && (
                    <span
                      style={{
                        color: "#faad14",
                        marginLeft: 8,
                        fontSize: "12px",
                      }}
                    >
                      (Not uploaded yet)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {img.originalName && `Original: ${img.originalName}`}
                  {img.size && ` (${(img.size / 1024).toFixed(1)} KB)`}
                </div>
              </div>
              <Select
                style={{ width: 180 }}
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
                disabled={isSubmitting}
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
                disabled={idx === 0 || isSubmitting}
                onClick={() => moveImage(idx, idx - 1)}
              >
                ↑
              </Button>
              <Button
                size="small"
                disabled={idx === images.length - 1 || isSubmitting}
                onClick={() => moveImage(idx, idx + 1)}
              >
                ↓
              </Button>
              <Button
                danger
                size="small"
                onClick={() => removeImage(idx)}
                disabled={isSubmitting}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={uploadProgress !== null}
          >
            {product ? "Update Product" : "Create Product"}
          </Button>
          <Button onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
