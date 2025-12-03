// app/dashboard/components/UserForm.js
"use client";
import { useEffect, useState } from "react";
import { Form, Input, Button, Select } from "antd";
import FormError from "./FormError"; // Import your new component

const { Option } = Select;

const UserForm = ({ user, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!user;

  useEffect(() => {
    if (isEditing && user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      form.resetFields();
    }
  }, [user, form, isEditing]);

  const onFinish = async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      const apiEndpoint = isEditing ? `/api/users/${user.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const payload = { ...values };
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(apiEndpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            (isEditing ? "Failed to update user" : "Failed to create user")
        );
      }

      if (onSuccess) onSuccess();
      if (!isEditing) form.resetFields();
    } catch (err) {
      setError(err.message || "An error occurred while saving the user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="pt-2" // Add top padding for breathing room
    >
      {/* Reusable Error Component */}
      <FormError error={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 gap-y-2">
        <Form.Item
          name="username"
          label={<span className="font-medium text-gray-700">Username</span>}
          rules={[{ required: true, message: "Please enter a username!" }]}
        >
          <Input className="h-10 rounded-md" placeholder="e.g. john.doe" />
        </Form.Item>

        <Form.Item
          name="email"
          label={
            <span className="font-medium text-gray-700">Email Address</span>
          }
          rules={[
            { required: true, message: "Please enter an email address!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input className="h-10 rounded-md" placeholder="user@example.com" />
        </Form.Item>

        {/* 2-Column Grid for clearer layout */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="role"
            label={<span className="font-medium text-gray-700">Role</span>}
            rules={[{ required: true, message: "Please select a role!" }]}
            className="mb-0" // Remove bottom margin inside grid
          >
            <Select
              placeholder="Select role"
              className="h-10"
              popupClassName="rounded-lg shadow-lg"
            >
              <Option value="admin">Admin</Option>
              <Option value="editor">Editor</Option>
              <Option value="viewer">Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span className="font-medium text-gray-700">
                {isEditing ? "New Password" : "Password"}
              </span>
            }
            rules={[{ required: !isEditing, message: "Required" }]}
            className="mb-0"
          >
            <Input.Password
              className="h-10 rounded-md"
              placeholder={isEditing ? "Optional" : "Required"}
            />
          </Form.Item>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          className="h-10 px-6 bg-blue-600 hover:bg-blue-500 border-none shadow-sm font-medium"
        >
          {isEditing ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </Form>
  );
};

export default UserForm;
