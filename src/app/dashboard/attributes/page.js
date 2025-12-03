"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Button, Modal, Form, Input, Space, App, Tag } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import DataTable from "../components/DataTable";

import {
  getAttributes,
  createAttribute,
  updateAttribute,
  updateAttributeValues,
} from "@/lib/api";

const AttributeDashboard = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isValuesModalOpen, setIsValuesModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);

  const [form] = Form.useForm();
  const [valuesForm] = Form.useForm();
  const { message } = App.useApp();

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const data = await getAttributes();
      setAttributes(data);
    } catch (err) {
      message.error(err.message || "Failed to fetch attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  // 1. Handle "Edit Name"
  const handleEditName = (record) => {
    setEditingAttr(record);
    // Explicitly reset/set values to ensure clean state since modal stays mounted
    form.resetFields();
    form.setFieldsValue({ name: record.name });
    setIsNameModalOpen(true);
  };

  // 2. Handle "Add New"
  const handleAddNew = () => {
    setEditingAttr(null);
    // Explicitly reset to clear any previous validation errors
    form.resetFields();
    setIsNameModalOpen(true);
  };

  // 3. Handle "Edit Values"
  const handleEditValues = (record) => {
    setEditingAttr(record);
    valuesForm.resetFields();
    valuesForm.setFieldsValue({
      values: (record.values || []).map((v) => v.value),
    });
    setIsValuesModalOpen(true);
  };

  const handleNameModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingAttr) {
        await updateAttribute(editingAttr.attribute_id, values.name);
        message.success("Attribute updated successfully");
      } else {
        await createAttribute(values.name);
        message.success("Attribute created successfully");
      }
      setIsNameModalOpen(false);
      fetchAttributes();
    } catch (err) {
      // Form validation errors are handled automatically by Antd
      if (!err.errorFields) {
        message.error(err.message || "Failed to save attribute");
      }
    }
  };

  const handleValuesModalOk = async () => {
    try {
      const values = await valuesForm.validateFields();
      await updateAttributeValues(editingAttr.attribute_id, values.values);
      message.success("Values updated successfully");
      setIsValuesModalOpen(false);
      fetchAttributes();
    } catch (err) {
      if (!err.errorFields) {
        message.error(err.message || "Failed to update values");
      }
    }
  };

  const columnsOverride = useMemo(
    () => [
      {
        title: "Attribute Name",
        dataIndex: "name",
        key: "name",
        width: "30%",
      },
      {
        title: "Values",
        dataIndex: "values",
        key: "values",
        render: (values, record) => (
          <Space wrap>
            {(values || []).slice(0, 5).map((v, i) => (
              <Tag key={i}>{v.value}</Tag>
            ))}
            {(values || []).length > 5 && <Tag>+{values.length - 5} more</Tag>}

            <Button
              size="small"
              type="dashed"
              icon={<EditOutlined />}
              onClick={() => handleEditValues(record)}
            >
              Manage Values
            </Button>
          </Space>
        ),
      },
    ],
    []
  );
  console.log(attributes);

  return (
    <div>
      <DataTable
        title="Attributes"
        data={attributes}
        loading={loading}
        apiBaseUrl="attributes"
        rowKeyField="attribute_id"
        onReload={fetchAttributes}
        onEdit={handleEditName}
        setIsModalOpen={handleAddNew}
        onDeleteSuccess={fetchAttributes}
        columnsOverride={columnsOverride}
      />

      {/* Name Modal */}
      <Modal
        title={editingAttr ? "Edit Attribute Name" : "Add New Attribute"}
        open={isNameModalOpen}
        onCancel={() => setIsNameModalOpen(false)}
        onOk={handleNameModalOk}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Attribute Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. Color, Size, Material" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Values Modal */}
      <Modal
        title={`Manage Values for ${editingAttr?.name || ""}`}
        open={isValuesModalOpen}
        onCancel={() => setIsValuesModalOpen(false)}
        onOk={handleValuesModalOk}
        width={600}
      >
        <Form form={valuesForm} layout="vertical">
          <Form.List name="values">
            {(fields, { add, remove }) => (
              <>
                <div className="max-h-[400px] overflow-y-auto pr-2 mb-4">
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      align="baseline"
                      className="flex mb-2 w-full"
                    >
                      <Form.Item
                        {...restField}
                        name={name}
                        rules={[{ required: true, message: "Missing value" }]}
                        className="flex-1 mb-0"
                      >
                        <Input placeholder="Value (e.g. Red, XL)" />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)} size="small">
                        Remove
                      </Button>
                    </Space>
                  ))}
                </div>
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Value
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default AttributeDashboard;
