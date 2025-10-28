"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
} from "antd";
// MODIFICATION: Import the new API helpers
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  updateAttributeValues,
  deleteAttribute,
} from "@/lib/api";

const AttributeDashboard = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const [form] = Form.useForm();
  const [valuesForm] = Form.useForm();
  const [valuesModalOpen, setValuesModalOpen] = useState(false);

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

  const handleAdd = () => {
    setEditingAttr(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (attr) => {
    setEditingAttr(attr);
    form.setFieldsValue({ name: attr.name });
    setModalOpen(true);
  };

  const handleEditValues = (attr) => {
    setEditingAttr(attr);
    // The values from the API are objects {value_id, value}, we need just the 'value' string for the form.
    valuesForm.setFieldsValue({ values: attr.values.map((v) => v.value) });
    setValuesModalOpen(true);
  };

  const handleDelete = async (attribute_id) => {
    try {
      await deleteAttribute(attribute_id);
      message.success("Attribute deleted successfully");
      fetchAttributes(); // Refresh the list
    } catch (err) {
      message.error(err.message || "Failed to delete attribute");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingAttr) {
        // Update existing attribute
        await updateAttribute(editingAttr.attribute_id, values.name);
        message.success("Attribute updated successfully");
      } else {
        // Create new attribute
        await createAttribute(values.name);
        message.success("Attribute created successfully");
      }
      setModalOpen(false);
      fetchAttributes(); // Refresh the list
    } catch (err) {
      // Validation errors are handled by the form, this catches API errors
      message.error(err.message || "Failed to save attribute");
    }
  };

  const handleValuesModalOk = async () => {
    try {
      const values = await valuesForm.validateFields();
      await updateAttributeValues(editingAttr.attribute_id, values.values);
      message.success("Values updated successfully");
      setValuesModalOpen(false);
      fetchAttributes(); // Refresh the list
    } catch (err) {
      message.error(err.message || "Failed to update values");
    }
  };

  const columns = [
    { title: "Attribute Name", dataIndex: "name", key: "name" },
    {
      title: "Values",
      dataIndex: "values",
      key: "values",
      render: (values, record) => (
        <span>
          {(values || []).map((v) => v.value).join(", ")}
          <Button
            size="small"
            style={{ marginLeft: 8 }}
            onClick={() => handleEditValues(record)}
          >
            Edit Values
          </Button>
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Edit Name
          </Button>
          <Popconfirm
            title="Delete this attribute?"
            onConfirm={() => handleDelete(record.attribute_id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Manage Attributes</h2>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add Attribute
      </Button>
      <Table
        dataSource={attributes}
        columns={columns}
        rowKey="attribute_id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingAttr ? "Edit Attribute Name" : "Add Attribute"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Attribute Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingAttr ? `Edit Values for ${editingAttr.name}` : "Edit Values"
        }
        open={valuesModalOpen}
        onCancel={() => setValuesModalOpen(false)}
        onOk={handleValuesModalOk}
      >
        <Form form={valuesForm} layout="vertical">
          <Form.List name="values">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    align="baseline"
                    style={{ display: "flex", marginBottom: 8 }}
                  >
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[
                        { required: true, message: "Value cannot be empty" },
                      ]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="Attribute Value" />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)} size="small">
                      -
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  + Add Value
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default AttributeDashboard;
