// src/app/dashboard/attributes/page.js
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

const AttributeDashboard = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const [form] = Form.useForm();
  const [valuesForm] = Form.useForm();
  const [valuesModalOpen, setValuesModalOpen] = useState(false);
  const [editingValues, setEditingValues] = useState([]);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attributes");
      const data = await res.json();
      setAttributes(data);
    } catch (err) {
      message.error("Failed to fetch attributes");
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
    setEditingValues(attr.values.map((v) => v.value));
    valuesForm.setFieldsValue({ values: attr.values.map((v) => v.value) });
    setValuesModalOpen(true);
  };

  const handleDelete = async (attribute_id) => {
    // Implement API call for delete (not shown here)
    message.info("Delete API not implemented");
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    // Implement API call for add/edit (not shown here)
    message.info("Add/Edit API not implemented");
    setModalOpen(false);
    fetchAttributes();
  };

  const columns = [
    { title: "Attribute Name", dataIndex: "name", key: "name" },
    {
      title: "Values",
      dataIndex: "values",
      key: "values",
      render: (values, record) => (
        <span>
          {values.map((v) => v.value).join(", ")}
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
            Edit
          </Button>
          <Popconfirm
            title="Delete?"
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
        title={editingAttr ? "Edit Attribute" : "Add Attribute"}
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
            {" "}
            <Input />{" "}
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          editingAttr ? `Edit Values for ${editingAttr.name}` : "Edit Values"
        }
        open={valuesModalOpen}
        onCancel={() => setValuesModalOpen(false)}
        onOk={async () => {
          const vals = await valuesForm.validateFields();
          try {
            await fetch("/api/attributes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                attribute_id: editingAttr.attribute_id,
                values: vals.values,
              }),
            });
            message.success("Values updated successfully");
            setValuesModalOpen(false);
            fetchAttributes();
          } catch (err) {
            message.error("Failed to update values");
          }
        }}
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
                      rules={[{ required: true, message: "Enter value" }]}
                    >
                      <Input placeholder="Value" />
                    </Form.Item>
                    <Button
                      danger
                      onClick={() => remove(name)}
                      size="small"
                      style={{ marginLeft: 8 }}
                    >
                      Remove
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Value
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
