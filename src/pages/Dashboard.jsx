import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    categories: 0,
    brands: 0,
    revenue: 0,
    pendingOrders: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [products, orders, users, categories, brands] = await Promise.all([
          getCollection("products"),
          getCollection("orders"),
          getCollection("users"),
          getCollection("categories"),
          getCollection("brands"),
        ]);

        const activeProducts = products.filter(
          (item) => item.status !== "INACTIVE",
        );

        const activeCategories = categories.filter(
          (item) => item.status !== "INACTIVE",
        );

        const activeBrands = brands.filter(
          (item) => item.status !== "INACTIVE",
        );

        const deliveredOrders = orders.filter(
          (order) => order.status === "Đã giao hàng",
        );

        setStats({
          products: activeProducts.length,
          orders: orders.length,
          customers: users.filter((user) => user.role === "CUSTOMER").length,
          categories: activeCategories.length,
          brands: activeBrands.length,
          revenue: deliveredOrders.reduce(
            (sum, order) => sum + Number(order.totalPrice || 0),
            0,
          ),
          pendingOrders: orders.filter(
            (order) => order.status === "Đang xử lý",
          ).length,
          lowStock: activeProducts.filter(
            (product) => Number(product.stock) <= 10,
          ).length,
        });
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <main className="dashboard-page">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>
          {loading
            ? "Đang tải dữ liệu tổng quan..."
            : error || "Tổng quan hoạt động cửa hàng ProBuild PC"}
        </p>
      </div>

      <section className="dashboard-grid">
        <Link to="/admin/products" className="dashboard-card blue">
          <span>📦</span>
          <h3>Sản phẩm</h3>
          <strong>{stats.products}</strong>
        </Link>

        <Link to="/admin/orders" className="dashboard-card green">
          <span>🧾</span>
          <h3>Đơn hàng</h3>
          <strong>{stats.orders}</strong>
        </Link>

        <Link to="/admin/categories" className="dashboard-card purple">
          <span>🗂️</span>
          <h3>Danh mục</h3>
          <strong>{stats.categories}</strong>
        </Link>

        <Link to="/admin/brands" className="dashboard-card red">
          <span>🏷️</span>
          <h3>Thương hiệu</h3>
          <strong>{stats.brands}</strong>
        </Link>

        <div className="dashboard-card orange">
          <span>👥</span>
          <h3>Khách hàng</h3>
          <strong>{stats.customers}</strong>
        </div>

        <Link to="/admin/products" className="dashboard-card gray">
          <span>⚠️</span>
          <h3>Sắp hết hàng</h3>
          <strong>{stats.lowStock}</strong>
        </Link>

        <div className="dashboard-card yellow">
          <span>💰</span>
          <h3>Doanh thu</h3>
          <strong>{stats.revenue.toLocaleString("vi-VN")}đ</strong>
        </div>

        <div className="dashboard-card pink">
          <span>⏳</span>
          <h3>Đơn cần xử lý</h3>
          <strong>{stats.pendingOrders}</strong>
        </div>
      </section>
    </main>
  );
}
