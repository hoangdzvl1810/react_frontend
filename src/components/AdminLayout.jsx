import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "./Modal";

export default function AdminLayout() {
  const { account, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    toast.info("Đã đăng xuất tài khoản quản trị.");
    setShowLogoutModal(false);
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: "📊", label: "Tổng quan Dashboard" },
    { to: "/admin/products", icon: "💻", label: "Quản lý Sản phẩm" },
    { to: "/admin/orders", icon: "📦", label: "Quản lý Đơn hàng" },
    { to: "/admin/categories", icon: "🏷️", label: "Quản lý Danh mục" },
    { to: "/admin/brands", icon: "🏢", label: "Quản lý Thương hiệu" },
  ];

  return (
    <div className="admin-app-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="logo-box">
              <div className="logo-icon">P</div>
              <div>
                <h2>
                  ProBuild <span>PC</span>
                </h2>
                <p>BUILD YOUR PERFECT PC</p>
              </div>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">QUẢN TRỊ HỆ THỐNG</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-main-container">
        <header className="admin-topbar">
          <div className="admin-topbar-breadcrumb">
            <span>Hệ thống Quản trị</span>
          </div>
          <div className="admin-topbar-actions">
            <div className="user-dropdown">
              <button className="dropdown-toggle" type="button">
                <div className="user-icon">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="user-info-text">
                  <h4>{account?.fullName || account?.username || "Admin"}</h4>
                  <p>Quản trị viên</p>
                </div>
              </button>
              <div className="dropdown-menu">
                <Link to="/profile">
                  <i className="fa-regular fa-id-card"></i> Thông tin cá nhân
                </Link>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="menu-item logout"
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị không?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
