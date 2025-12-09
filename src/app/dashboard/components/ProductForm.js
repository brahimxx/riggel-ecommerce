// app/dashboard/components/ProductForm.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Upload,
  Form,
  Input,
  InputNumber,
  Select,
  Progress,
  Space,
  Divider,
  Alert,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import FormError from "./FormError"; // Import reusable component

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

  // State
  const [images, setImages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [productName, setProductName] = useState(product?.name || "");

  // Upload & Error State
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null); // Local error for file validation
  const [formError, setFormError] = useState(null); // Global form submission error
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PRODUCT_IMAGE_VALUE = "product";

  // Sync images state to Form field for validation
  useEffect(() => {
    form.setFieldsValue({ images: images });
    if (images.length === 0 && form.isFieldTouched("images")) {
      form.validateFields(["images"]);
    }
  }, [images, form]);

  // 1. Fetch Attributes
  useEffect(() => {
    const fetchAttrs = async () => {
      try {
        const res = await fetch("/api/attributes");
        const data = await res.json();
        setAttributes(data);
      } catch {
        setAttributes([]);
      }
    };
    fetchAttrs();
  }, []);

  // 2. Helpers
  const generateVariantLabel = useCallback((variant, index) => {
    if (!variant) return `Variant ${index + 1}`;
    if (variant.sku?.trim()) return variant.sku;
    if (variant.attributes) {
      const attrValues = Object.values(variant.attributes).filter(Boolean);
      if (attrValues.length > 0) return attrValues.join(" / ");
    }
    return `Variant ${index + 1}`;
  }, []);

  const createVariantOption = useCallback(
    (variant, index) => {
      if (!variant)
        return { label: `Variant ${index + 1}`, value: `temp-${index}`, index };
      const attrs = Array.isArray(variant.attributes)
        ? variant.attributes.reduce(
            (acc, attr) => ({ ...acc, [attr.name]: attr.value }),
            {}
          )
        : variant.attributes || {};
      const label = generateVariantLabel(
        { ...variant, attributes: attrs },
        index
      );
      return {
        label,
        value: variant.variant_id
          ? Number(variant.variant_id)
          : `temp-${index}`,
        index,
      };
    },
    [generateVariantLabel]
  );

  const updateVariantOptions = useCallback(() => {
    const formVariants = form.getFieldValue("variants");
    if (!Array.isArray(formVariants) || formVariants.length === 0) {
      setVariantOptions([]);
      return;
    }
    setVariantOptions(formVariants.map((v, i) => createVariantOption(v, i)));
  }, [form, createVariantOption]);

  const handleValuesChange = (changedValues) => {
    if (changedValues.name !== undefined) setProductName(changedValues.name);
    if (changedValues.variants !== undefined) updateVariantOptions();
  };

  // 4. Initialize Form Data
  useEffect(() => {
    if (product) {
      const variants = (product.variants || []).map((v) => ({
        ...v,
        attributes: Array.isArray(v.attributes)
          ? v.attributes.reduce(
              (acc, attr) => ({ ...acc, [attr.name]: attr.value }),
              {}
            )
          : v.attributes || {},
      }));

      const loadedImages = (product.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        originalName: img.original_filename || img.originalName,
        mimeType: img.mime_type || img.mimeType,
        size: img.size,
        alt_text: img.alt_text || "",
        sort_order: img.sort_order || 0,
        is_primary: img.is_primary || false,
        variant_id: img.variant_id ? Number(img.variant_id) : null,
        isPending: false,
      }));

      setImages(loadedImages);
      setProductName(product.name || "");
      setVariantOptions(
        (product.variants || []).map((v, i) => createVariantOption(v, i))
      );

      form.setFieldsValue({
        name: product.name,
        description: product.description,
        category_ids: product.categories
          ? product.categories.map((c) => c.category_id)
          : [],
        variants: variants.length ? variants : [{}],
        images: loadedImages,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ variants: [{}] });
      setImages([]);
      setProductName("");
      setVariantOptions([]);
      setPendingFiles([]);
      setDeletedImageUrls([]);
      setTimeout(updateVariantOptions, 0);
    }
  }, [product, form]);

  // 5. Upload Logic
  const getProductId = () => product?.product_id || "new";

  const uploadFileToServer = async (file, productId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    return await res.json();
  };

  const beforeUpload = (file) => {
    setUploadError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPG, PNG, GIF, or WEBP allowed.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_SIZE) {
      setUploadError("Image too large (Max 5MB).");
      return Upload.LIST_IGNORE;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingFiles((prev) => [...prev, file]);

    setImages((prev) => [
      ...prev,
      {
        id: null,
        url: previewUrl,
        file,
        isPending: true,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        alt_text: "",
        sort_order: prev.length,
        is_primary: prev.length === 0,
        variant_id: null,
      },
    ]);
    return false;
  };

  const removeImage = (idx) => {
    const removed = images[idx];
    if (removed.isPending && removed.url) URL.revokeObjectURL(removed.url);
    if (!removed.isPending && removed.url)
      setDeletedImageUrls((prev) => [...prev, removed.url]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveImage = (from, to) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr.map((img, i) => ({
        ...img,
        sort_order: i,
        is_primary: i === 0,
      }));
    });
  };

  const uploadAllPendingFiles = async (productId) => {
    const results = [];
    let count = 0;

    for (const img of images) {
      if (img.isPending && img.file) {
        setUploadProgress(Math.round((count / images.length) * 100));
        try {
          const res = await uploadFileToServer(img.file, productId);
          results.push({
            url: res.url,
            filename: res.filename,
            originalName: res.originalName,
            mimeType: res.mimeType,
            size: res.size,
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
          count++;
        } catch (err) {
          throw new Error(
            `Failed to upload ${img.originalName}: ${err.message}`
          );
        }
      } else {
        let vId = img.variant_id;
        let vIndex = null;
        if (typeof vId === "string" && vId.startsWith("temp-")) {
          vIndex = parseInt(vId.replace("temp-", ""));
          vId = null;
        }
        results.push({ ...img, variant_id: vId, variant_index: vIndex });
      }
    }
    setUploadProgress(null);
    return results;
  };

  const onFinish = async (values) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFormError(null); // Clear global errors
      setUploadError(null); // Clear upload errors

      const productId = getProductId();
      const uploadedImages = await uploadAllPendingFiles(productId);

      const variantsPayload = (values.variants || []).map((v) => {
        const attrs = attributes
          .map((a) => ({ name: a.name, value: v.attributes?.[a.name] || "" }))
          .filter((a) => a.value !== "");
        return { ...v, attributes: attrs };
      });

      const payload = {
        name: values.name,
        description: values.description,
        category_ids: values.category_ids,
        variants: variantsPayload,
        images: uploadedImages,
      };

      if (product && deletedImageUrls.length > 0) {
        payload.deletedImages = deletedImageUrls;
      }

      const url = product
        ? `/api/products/by-id/${product.product_id}`
        : `/api/products`;
      const res = await fetch(url, {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "API request failed");
      }

      images.forEach((img) => {
        if (img.isPending && img.url) URL.revokeObjectURL(img.url);
      });
      setDeletedImageUrls([]);

      if (onSuccess) onSuccess();

      if (!product) {
        form.resetFields();
        setImages([]);
        setPendingFiles([]);
        setDeletedImageUrls([]);
        setVariantOptions([]);
        setProductName("");
        // Reset variants to initial state
        form.setFieldsValue({ variants: [{}] });
      }
    } catch (err) {
      setFormError(err.message || "Something went wrong."); // Set Global Error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={handleValuesChange}
      className="pt-2"
    >
      {/* Global Form Error */}
      <FormError error={formError} onClose={() => setFormError(null)} />

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

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: "Description is required." }]}
      >
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

      <Form.Item
        label="Images"
        name="images"
        rules={[
          {
            required: true,
            message: "At least one image is required.",
            validator: (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject(
                  new Error("At least one image is required.")
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <div>
          <Upload
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            multiple
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            disabled={(!productName && !product?.product_id) || isSubmitting}
          >
            <button type="button" style={{ border: 0, background: "none" }}>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>
                {isSubmitting ? "..." : "Upload"}
              </div>
            </button>
          </Upload>

          {!productName && !product?.product_id && (
            <div style={{ color: "#999", fontSize: "12px", marginTop: 4 }}>
              Enter a product name first to enable image selection
            </div>
          )}

          {/* Keep local Alert for upload-specific errors (like file size) */}
          {uploadError && (
            <Alert
              message={uploadError}
              type="error"
              showIcon
              closable
              onClose={() => setUploadError(null)}
              style={{ marginTop: 8 }}
            />
          )}
          {uploadProgress !== null && (
            <Progress percent={uploadProgress} size="small" status="active" />
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
                  alt={img.originalName}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold" }}>
                    {idx === 0 ? (
                      <span style={{ color: "green" }}>★ Main</span>
                    ) : (
                      `Image ${idx + 1}`
                    )}
                    {img.isPending && (
                      <span
                        style={{
                          color: "#faad14",
                          marginLeft: 8,
                          fontSize: "12px",
                        }}
                      >
                        (Pending)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {img.originalName}
                  </div>
                </div>
                <Select
                  style={{ width: 180 }}
                  value={
                    img.variant_id === null
                      ? PRODUCT_IMAGE_VALUE
                      : img.variant_id
                  }
                  onChange={(val) =>
                    setImages((prev) =>
                      prev.map((im, i) =>
                        i === idx
                          ? {
                              ...im,
                              variant_id:
                                val === PRODUCT_IMAGE_VALUE ? null : val,
                            }
                          : im
                      )
                    )
                  }
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
            {product ? "Update" : "Create"}
          </Button>
          <Button htmlType="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
