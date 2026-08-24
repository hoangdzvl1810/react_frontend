import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "./Modal";

export default function Header() {
  const { account, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchKeyword.trim();
    if (!q) {
      navigate("/categories");
      return;
    }
    navigate(`/categories?keyword=${encodeURIComponent(q)}`);
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.info("Đã đăng xuất tài khoản.");
    setShowLogoutModal(false);
    navigate("/login");
  };

  const fullName = account?.fullName || account?.username || "";
  const isShopActive =
    location.pathname.startsWith("/categories") ||
    location.pathname.startsWith("/brands");

  return (
    <>
      <header className="main-header">
        <div className="header-top-line"></div>

        <nav className="header-menu">
          {!isAdmin && (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `menu-item ${isActive ? "active" : ""}`
                }
              >
                <i className="fa-solid fa-house"></i> Trang chủ
              </NavLink>
              <span className="menu-divider"></span>

              <div className="menu-dropdown">
                <button
                  className={`menu-item menu-dropdown-toggle ${
                    isShopActive ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => navigate("/categories")}
                >
                  <i className="fa-solid fa-layer-group"></i> Sản phẩm & Linh kiện
                  <span className="menu-dropdown-arrow">▾</span>
                </button>
                <div className="menu-dropdown-list">
                  <Link to="/categories">Tất cả sản phẩm</Link>
                  <Link to="/brands">Xem theo thương hiệu</Link>
                </div>
              </div>
              <span className="menu-divider"></span>
            </>
          )}

          {account && !isAdmin && (
            <NavLink
              to="/order-history"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <i className="fa-solid fa-clipboard-list"></i> Lịch sử đơn hàng
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/dashboard"
              className="menu-item admin-highlight-link"
              style={{ color: "#38bdf8", fontWeight: "bold" }}
            >
              <i className="fa-solid fa-gauge-high"></i> Vào trang Quản trị (Admin)
            </NavLink>
          )}
        </nav>

        <div className="header-bottom">
          <Link to={isAdmin ? "/dashboard" : "/"} style={{ textDecoration: "none", color: "inherit" }}>
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

          {!isAdmin && (
            <form className="search-box" onSubmit={handleSearchSubmit}>
              <input
                className="search-input"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm CPU, VGA, RAM, Màn hình, ASUS..."
              />
              <button className="search-submit" type="submit">
                <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
              </button>
            </form>
          )}

          <div className="right-box">
            {!isAdmin && (
              <Link className="cart-box" to="/cart">
                <div className="cart-icon">
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span className="cart-badge">{cartCount}</span>
                </div>
                <p>Giỏ hàng</p>
              </Link>
            )}

            {account ? (
              <div className="user-dropdown">
                <button className="dropdown-toggle" type="button">
                  <div className="user-icon">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div>
                    <h4>{fullName}</h4>
                    <p>{isAdmin ? "Quản trị viên" : "Khách hàng"}</p>
                  </div>
                </button>
                <div className="dropdown-menu">
                  <Link to="/profile">
                    <i className="fa-regular fa-id-card"></i> Thông tin cá nhân
                  </Link>
                  {!isAdmin && (
                    <Link to="/order-history">
                      <i className="fa-solid fa-clipboard-list"></i> Đơn hàng của tôi
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="menu-item logout"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="login-buttons">
                <Link to="/login" className="login-btn">
                  <i className="fa-solid fa-user"></i> Đăng nhập
                </Link>
                <Link to="/register" className="register-btn1">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?"
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        type="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
