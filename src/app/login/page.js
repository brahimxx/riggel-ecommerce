"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Flex, Alert, App } from "antd";

const LoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { message } = App.useApp();
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }

      message?.success("Login successful! Redirecting...");
      // Redirect to the dashboard or another protected page
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="login"
      initialValues={{ remember: true }}
      style={{ maxWidth: 360, margin: "auto", paddingTop: "100px" }}
      onFinish={onFinish}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Flex justify="space-between" align="center">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Link href="/forgot-password">Forgot password</Link>
        </Flex>
      </Form.Item>

      <Form.Item>
        <Button
          block
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          or <Link href="/register">Register now!</Link>
        </div>
      </Form.Item>
    </Form>
  );
};

export default LoginPage;
