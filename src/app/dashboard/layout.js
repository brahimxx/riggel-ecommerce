"use client";
import "./dashboard.css";
import "@ant-design/v5-patch-for-react-19";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 1. Import usePathname

import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical bg-auto h-16"></div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={[
            {
              key: "/dashboard/products",
              icon: <UserOutlined />,
              label: <Link href="/dashboard/products">Products</Link>,
            },
            {
              key: "/dashboard/orders",
              icon: <VideoCameraOutlined />,
              label: <Link href="/dashboard/orders">Orders</Link>,
            },
            {
              key: "/dashboard/categories",
              icon: <UploadOutlined />,
              label: <Link href="/dashboard/categories">Categories</Link>,
            },
            {
              key: "/dashboard/users",
              icon: <UploadOutlined />,
              label: <Link href="/dashboard/users">Users</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
