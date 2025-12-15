"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Flex, Alert } from "antd";

const LoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animation State
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") {
      setStartAnim(true);
    } else {
      const handleLoad = () => setStartAnim(true);
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
    // Fallback
    const timer = setTimeout(() => setStartAnim(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // We use a light gray background for the page
  const pageBg = "#f9fafb"; // Tailwind gray-50

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      {/* ANIMATED LOGO AREA */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-10">
        {/* 
            EXACT STRUCTURE FROM HEADER 
            Scaled up slightly (scale-125) for visibility, but structure remains identical.
        */}
        <div className="flex items-center overflow-hidden transform scale-125 origin-center">
          {/* R logo container */}
          {/* IMPORTANT: bg-transparent here so it sits on the page bg, 
              OR match page bg if riggel-logo-bg relies on it */}
          <div className={`z-10 relative ${startAnim ? "riggel-logo-bg" : ""}`}>
            {/* Ensure the image sits on top of the gray background cleanly */}
            <div className="bg-gray-50 z-10 relative">
              <Image
                src="/logo.png"
                alt="Riggel Logo"
                width={40}
                height={40}
                priority
              />
            </div>
          </div>

          {/* Wrapper for fade + text */}
          <div className="relative flex items-center">
            {/* 
               Static fade strip 
               CRITICAL FIX: The background must match the PAGE background (gray-50 / #f9fafb)
               otherwise the 'fade' looks like a white box.
            */}
            <div
              className={`z-20 pointer-events-none absolute left-0 top-0 h-full w-8 ${
                startAnim ? "riggel-fade" : ""
              }`}
              style={{
                background: `linear-gradient(to right, ${pageBg}, transparent)`,
              }}
            />

            <span
              className={`font-integral text-[#669900] text-2xl font-bold whitespace-nowrap opacity-0 ${
                startAnim ? "riggel-text-slide" : ""
              }`}
            >
              iggel
            </span>
          </div>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form
            name="login"
            initialValues={{ remember: true }}
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <h2 className="mt-0 mb-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Sign in
            </h2>

            {error && (
              <Alert message={error} type="error" showIcon className="!mb-3" />
            )}

            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your Username!" },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button
                block
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-black hover:!bg-gray-800 border-none h-10 font-medium"
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
