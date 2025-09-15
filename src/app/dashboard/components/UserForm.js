"use client";
import { useEffect, useState } from "react";
import { Form, Input, Button, Select, message } from "antd";

const { Option } = Select;

const UserForm = ({ user, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!user;

  // Set form fields when the modal opens for editing
  useEffect(() => {
    if (isEditing) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role, // Use role
      });
    } else {
      form.resetFields();
    }
  }, [user, form, isEditing]);
  const onFinish = (values) => {
    setSubmitting(true);

    const apiEndpoint = isEditing ? `/api/users/${user.id}` : "/api/users";

    const method = isEditing ? "PUT" : "POST";

    // When editing, if the password field is empty, don't send it in the request
    if (isEditing && !values.password) {
      delete values.password;
    }

    fetch(apiEndpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            isEditing ? "Failed to update user" : "Failed to create user"
          );
        }
        return res.json();
      })
      .then(() => {
        message.success(
          `User ${isEditing ? "updated" : "added"} successfully!`
        );
        onSuccess(); // Trigger parent to refresh and close modal
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true, message: "Please enter a username!" }]}
      >
        <Input placeholder="e.g., john.doe" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email Address"
        rules={[
          { required: true, message: "Please enter an email address!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input placeholder="e.g., john.doe@example.com" />
      </Form.Item>

      <Form.Item
        name="password"
        label={isEditing ? "New Password (optional)" : "Password"}
        rules={[
          {
            required: !isEditing,
            message: "Password is required for new users!",
          },
        ]}
      >
        <Input.Password
          placeholder={
            isEditing
              ? "Leave blank to keep current password"
              : "Enter a strong password"
          }
        />
      </Form.Item>

      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true, message: "Please select a role!" }]}
      >
        <Select placeholder="Select a role for the user">
          <Option value="admin">Admin</Option>
          <Option value="editor">Editor</Option>
          <Option value="viewer">Viewer</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {isEditing ? "Update User" : "Add User"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;
