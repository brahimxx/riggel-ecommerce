"use client";
import { Card, Row, Col, Statistic, Table, Spin, Empty, Tag } from "antd";
import {
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  ProductOutlined,
  AppstoreOutlined,
  ControlOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  getProducts,
  getOrders,
  getUsers,
  getCategories,
  getAttributes,
  getSales,
} from "@/lib/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalAttributes: 0,
    totalActiveSales: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    topProducts: [],
    recentOrders: [],
    lowStockProducts: [],
    activeSales: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        productsData,
        ordersData,
        usersData,
        categoriesData,
        attributesData,
        salesData,
      ] = await Promise.all([
        getProducts({ limit: 1000 }),
        getOrders(),
        getUsers(),
        getCategories(),
        getAttributes(),
        getSales(),
      ]);

      // Extract data
      const orders = ordersData || [];
      const users = usersData || [];
      const products = productsData?.products || [];
      const totalProducts = productsData?.total || products.length;
      const categories = categoriesData || [];
      const attributes = attributesData || [];
      const sales = salesData || [];

      // Calculate total revenue from all orders
      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      );

      const totalOrders = orders.length;

      // Count customers (users with role 'user')
      const totalCustomers = users.filter(
        (user) => user.role === "user"
      ).length;

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Count active sales
      const now = new Date();
      const activeSales = sales.filter((sale) => {
        const start = new Date(sale.start_date);
        const end = new Date(sale.end_date);
        return now >= start && now <= end;
      });

      // Calculate growth
      let revenueGrowth = 0;
      let ordersGrowth = 0;

      if (orders.length > 0) {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthOrders = orders.filter((order) => {
          const orderDate = new Date(order.order_date);
          return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear
          );
        });

        const previousMonthOrders = orders.filter((order) => {
          const orderDate = new Date(order.order_date);
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return (
            orderDate.getMonth() === prevMonth &&
            orderDate.getFullYear() === prevYear
          );
        });

        const currentMonthRevenue = currentMonthOrders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0
        );

        const previousMonthRevenue = previousMonthOrders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0
        );

        revenueGrowth =
          previousMonthRevenue > 0
            ? ((currentMonthRevenue - previousMonthRevenue) /
                previousMonthRevenue) *
              100
            : currentMonthRevenue > 0
            ? 100
            : 0;

        ordersGrowth =
          previousMonthOrders.length > 0
            ? ((currentMonthOrders.length - previousMonthOrders.length) /
                previousMonthOrders.length) *
              100
            : currentMonthOrders.length > 0
            ? 100
            : 0;
      }

      // Get top products based on total_orders
      const topProducts = products
        .filter((p) => parseInt(p.total_orders) > 0)
        .sort((a, b) => parseInt(b.total_orders) - parseInt(a.total_orders))
        .slice(0, 5)
        .map((product) => ({
          key: product.product_id,
          name: product.name,
          orders: parseInt(product.total_orders),
          revenue: parseFloat(product.price) * parseInt(product.total_orders),
          stock: parseInt(product.total_variants_quantities),
        }));

      // Get low stock products (less than 10 items)
      const lowStockProducts = products
        .filter((p) => parseInt(p.total_variants_quantities) < 10)
        .sort(
          (a, b) =>
            parseInt(a.total_variants_quantities) -
            parseInt(b.total_variants_quantities)
        )
        .slice(0, 5)
        .map((product) => ({
          key: product.product_id,
          name: product.name,
          stock: parseInt(product.total_variants_quantities),
          price: parseFloat(product.price),
        }));

      // Get recent orders
      const recentOrders = orders
        .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
        .slice(0, 5)
        .map((order) => ({
          key: order.order_id,
          orderId: `#${order.order_id}`,
          customer: order.client_name || order.email || "Guest",
          amount: parseFloat(order.total_amount || 0),
          status: order.status || "pending",
          date: new Date(order.order_date).toLocaleDateString(),
        }));

      setDashboardData({
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories: categories.length,
        totalAttributes: attributes.length,
        totalActiveSales: activeSales.length,
        averageOrderValue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
        topProducts,
        recentOrders,
        lowStockProducts,
        activeSales: activeSales.slice(0, 3).map((sale) => ({
          key: sale.id,
          name: sale.name,
          discount:
            sale.discount_type === "percentage"
              ? `${sale.discount_value}%`
              : `$${sale.discount_value}`,
          endDate: new Date(sale.end_date).toLocaleDateString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const topProductsColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: "40%",
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      sorter: (a, b) => a.orders - b.orders,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock) => (
        <Tag color={stock < 10 ? "red" : stock < 20 ? "orange" : "green"}>
          {stock}
        </Tag>
      ),
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => `$${value.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  const lowStockColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock) => <Tag color="red">{stock}</Tag>,
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price.toFixed(2)}`,
    },
  ];

  const recentOrdersColumns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          completed: {
            bg: "bg-green-100",
            text: "text-green-800",
            label: "Completed",
          },
          delivered: {
            bg: "bg-green-100",
            text: "text-green-800",
            label: "Delivered",
          },
          pending: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            label: "Pending",
          },
          processing: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            label: "Processing",
          },
          shipped: {
            bg: "bg-indigo-100",
            text: "text-indigo-800",
            label: "Shipped",
          },
          cancelled: {
            bg: "bg-red-100",
            text: "text-red-800",
            label: "Cancelled",
          },
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
          <span
            className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
        );
      },
    },
  ];

  const activeSalesColumns = [
    {
      title: "Sale Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (discount) => <Tag color="green">{discount} OFF</Tag>,
    },
    {
      title: "Ends",
      dataIndex: "endDate",
      key: "endDate",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards - Row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Total Revenue"
              value={dashboardData.totalRevenue}
              precision={2}
              prefix="$"
              suffix={
                dashboardData.revenueGrowth !== 0 && (
                  <span className="text-sm ml-2">
                    {dashboardData.revenueGrowth > 0 ? (
                      <span className="text-green-600">
                        <RiseOutlined /> {dashboardData.revenueGrowth}%
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <FallOutlined /> {Math.abs(dashboardData.revenueGrowth)}
                        %
                      </span>
                    )}
                  </span>
                )
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Total Orders"
              value={dashboardData.totalOrders}
              prefix={<ShoppingCartOutlined />}
              suffix={
                dashboardData.ordersGrowth !== 0 && (
                  <span className="text-sm ml-2">
                    {dashboardData.ordersGrowth > 0 ? (
                      <span className="text-green-600">
                        <RiseOutlined /> {dashboardData.ordersGrowth}%
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <FallOutlined /> {Math.abs(dashboardData.ordersGrowth)}%
                      </span>
                    )}
                  </span>
                )
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Total Customers"
              value={dashboardData.totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Avg Order Value"
              value={dashboardData.averageOrderValue}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics - Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Total Products"
              value={dashboardData.totalProducts}
              prefix={<ProductOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Categories"
              value={dashboardData.totalCategories}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Attributes"
              value={dashboardData.totalAttributes}
              prefix={<ControlOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Active Sales"
              value={dashboardData.totalActiveSales}
              prefix={<PercentageOutlined />}
              valueStyle={{
                color:
                  dashboardData.totalActiveSales > 0 ? "#3f8600" : undefined,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Data Tables - Row 3 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Top Performing Products"
            variant="outlined"
            className="shadow-sm"
          >
            {dashboardData.topProducts.length > 0 ? (
              <Table
                columns={topProductsColumns}
                dataSource={dashboardData.topProducts}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No product sales data available yet" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Orders" variant="outlined" className="shadow-sm">
            {dashboardData.recentOrders.length > 0 ? (
              <Table
                columns={recentOrdersColumns}
                dataSource={dashboardData.recentOrders}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No orders yet" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Additional Data Tables - Row 4 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Low Stock Alert"
            variant="outlined"
            className="shadow-sm"
          >
            {dashboardData.lowStockProducts.length > 0 ? (
              <Table
                columns={lowStockColumns}
                dataSource={dashboardData.lowStockProducts}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="All products are well stocked" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Active Sales Campaigns"
            variant="outlined"
            className="shadow-sm"
          >
            {dashboardData.activeSales.length > 0 ? (
              <Table
                columns={activeSalesColumns}
                dataSource={dashboardData.activeSales}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No active sales campaigns" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
