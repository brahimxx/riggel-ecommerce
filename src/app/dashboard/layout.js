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
    if (document.readyState === "complete") {
      setStartAnim(true);
      return;
    }
    const handleLoad = () => setStartAnim(true);
    window.addEventListener("load", handleLoad);
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* STICKY SIDER */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 101, // Higher than header if they overlap, though usually side-by-side
          background: "white",
        }}
      >
        <div className=" h-[64px]  border-b-1 border-[#e6e6e6] pl-6 pr-4 flex items-center sticky top-0 z-50">
          <Link href="/dashboard" className="flex items-center overflow-hidden">
            <div className="bg-white z-10 w-[30px] h-[30px] flex-shrink-0 ">
              <Image
                src="/logo.png"
                alt="Riggel Logo"
                width={30}
                height={30}
                priority
              />
            </div>
            <div className="relative flex items-center ">
              <div
                className={`z-20 pointer-events-none absolute left-0 top-0 h-full w-8 ${
                  startAnim ? "riggel-fade" : ""
                }`}
              />
              <span
                className={`text-[#669900]  font-integral text-2xl font-bold whitespace-nowrap opacity-0 w-0 overflow-hidden transition-all duration-500 ease-in-out ${
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
        {/* STICKY HEADER */}
        <Header
          style={{
            padding: 0,
            background: "white",
            position: "sticky",
            top: 0,
            zIndex: 100,
            width: "100%",
          }}
          className="flex justify-between !pr-5 border-b-1 !border-[#e6e6e6] "
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
            margin: "16px 16px",
            borderRadius: borderRadiusLG,
            overflow: "initial", // Allow content to scroll naturally
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
