"use client";
import "./dashboard.css";
import "@ant-design/v5-patch-for-react-19";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileMenu from "./components/ProfileMenu";
import Image from "next/image";
import { useState, useEffect } from "react";

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PercentageOutlined,
  UserOutlined,
  ProfileOutlined,
  ProductOutlined,
  BarsOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    // If page is already fully loaded (e.g. fast reload), start immediately
    if (document.readyState === "complete") {
      setStartAnim(true);
      return;
    }

    // Otherwise wait for the real window "load" event
    const handleLoad = () => setStartAnim(true);
    window.addEventListener("load", handleLoad);

    return () => window.removeEventListener("load", handleLoad);
  }, []);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="bg-white h-[64px] pl-6 pr-4 flex items-center shadow-[0_0px_0px_-10px_rgba(0,0,0,0.6)]">
          <Link href="/dashboard" className="flex items-center overflow-hidden">
            {/* Fixed-width wrapper for R logo */}
            <div className="bg-white z-10 w-[30px] h-[30px] flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Riggel Logo"
                width={30}
                height={30}
                priority
              />
            </div>

            {/* Wrapper for fade + text */}
            <div className="relative flex items-center">
              {/* Static fade strip from right edge of the image */}
              <div
                className={`z-20 pointer-events-none absolute left-0 top-0 h-full w-8 ${
                  startAnim ? "riggel-fade" : ""
                }`}
              />
              <span
                className={`font-integral text-2xl font-bold whitespace-nowrap opacity-0 w-0 overflow-hidden transition-all duration-500 ease-in-out ${
                  startAnim && !collapsed
                    ? "riggel-text-slide opacity-100 w-auto delay-150"
                    : ""
                }`}
              >
                iggel
              </span>
            </div>
          </Link>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={[
            {
              key: "/dashboard/products",
              icon: <ProductOutlined />,
              label: <Link href="/dashboard/products">Products</Link>,
            },
            {
              key: "/dashboard/orders",
              icon: <ProfileOutlined />,
              label: <Link href="/dashboard/orders">Orders</Link>,
            },
            {
              key: "/dashboard/categories",
              icon: <BarsOutlined />,
              label: <Link href="/dashboard/categories">Categories</Link>,
            },
            {
              key: "/dashboard/users",
              icon: <UserOutlined />,
              label: <Link href="/dashboard/users">Users</Link>,
            },
            {
              key: "/dashboard/attributes",
              icon: <ControlOutlined />,
              label: <Link href="/dashboard/attributes">Attributes</Link>,
            },
            {
              key: "/dashboard/sales",
              icon: <PercentageOutlined />,
              label: <Link href="/dashboard/sales">Sales</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{ padding: 0, background: colorBgContainer }}
          className="flex justify-between !pr-5 shadow-[0_0px_0px_-10px_rgba(0,0,0,0.6)]"
        >
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
          <ProfileMenu />
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
