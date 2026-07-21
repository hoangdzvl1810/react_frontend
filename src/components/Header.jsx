import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getStoredAccount, readCart } from "../utils/cartStorage";

export default function Header() {
  // Lưu thông tin tài khoản và tổng số sản phẩm trong giỏ hàng
  const [account, setAccount] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Đồng bộ tài khoản khi đăng nhập, đăng xuất hoặc localStorage thay đổi
  useEffect(() => {
    const updateAccount = () => {
      const storedAccount = getStoredAccount();
      setAccount(storedAccount);
    };

    updateAccount();

    window.addEventListener("accountUpdated", updateAccount);
    window.addEventListener("storage", updateAccount);

    return () => {
      window.removeEventListener("accountUpdated", updateAccount);
      window.removeEventListener("storage", updateAccount);
    };
  }, []);

  // Tính lại tổng số lượng sản phẩm khi giỏ hàng hoặc tài khoản thay đổi
  useEffect(() => {
    const updateCartCount = () => {
      const storedAccount = getStoredAccount();

      if (!storedAccount) {
        setCartCount(0);
        return;
      }

      const cart = readCart();
      const total = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );

      setCartCount(total);
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, [account]);

  // Xóa tài khoản và quay về trang chủ khi đăng xuất
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("account");
    window.location.href = "/"; // Reload về trang chủ
  };

  // Dữ liệu dùng để phân quyền và hiển thị người dùng
  const roleName = account?.role || "CUSTOMER";
  const fullName = account?.fullName || "";
  return (
    <header className="main-header">
      <div className="header-top-line"></div>

      {/* Menu điều hướng thay đổi theo vai trò */}
      <nav className="header-menu">
        {/* Menu dành cho khách hàng */}
        {roleName === "CUSTOMER" && (
          <>
            <Link to="/" className="menu-item active">
              <i className="fa-solid fa-house"></i> Trang chủ
            </Link>
            <span className="menu-divider"></span>

            <div className="menu-dropdown">
              <button className="menu-item menu-dropdown-toggle" type="button">
                <i className="fa-solid fa-layer-group"></i> Danh mục sản phẩm
                <span className="menu-dropdown-arrow">▾</span>
              </button>
              <div className="menu-dropdown-list">
                <Link to="/categories">Sản phẩm</Link>
                <Link to="/brands">Các thương hiệu sản phẩm</Link>
              </div>
            </div>
            <span className="menu-divider"></span>

            <Link to="/order-history" className="menu-item">
              <i className="fa-solid fa-clipboard-list"></i> Lịch sử đơn hàng
            </Link>
          </>
        )}

        {/* Menu dành cho quản trị viên */}
        {roleName === "ADMIN" && (
          <>
            <Link to="/dashboard" className="menu-item active">
              <i className="fa-solid fa-gauge-high"></i> Dashboard
            </Link>
            <span className="menu-divider"></span>

            <Link to="/admin/orders" className="menu-item">
              <i className="fa-solid fa-boxes-stacked"></i> Quản lý đơn hàng
            </Link>
            <span className="menu-divider"></span>

            <div className="menu-dropdown">
              <button className="menu-item menu-dropdown-toggle" type="button">
                <i className="fa-solid fa-microchip"></i> Sản phẩm
                <span className="menu-dropdown-arrow">▾</span>
              </button>
              <div className="menu-dropdown-list">
                <Link to="/admin/products">Quản lý sản phẩm</Link>
                <Link to="/admin/categories">Quản lý danh mục</Link>
                <Link to="/admin/brands">Quản lý thương hiệu</Link>
              </div>
            </div>
          </>
        )}
      </nav>

      <div className="header-bottom">
        {/* Admin chỉ thấy logo; khách hàng có thể bấm để về trang chủ */}
        {roleName === "ADMIN" ? (
          <div className="logo-box" style={{ cursor: "default" }}>
            <div className="logo-icon">P</div>
            <div>
              <h2>
                ProBuild <span>PC</span>
              </h2>
              <p>BUILD YOUR PERFECT PC</p>
            </div>
          </div>
        ) : (
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
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
        )}

        {/* Chỉ khách hàng mới sử dụng thanh tìm kiếm */}
        {roleName !== "ADMIN" && (
          <form className="search-box" action="/categories" method="get">
            <input
              className="search-input"
              type="text"
              name="keyword"
              placeholder="Tìm kiếm linh kiện..."
            />
            <button className="search-submit" type="submit">
              Tìm kiếm
            </button>
          </form>
        )}

        <div className="right-box">
          {/* Giỏ hàng chỉ hiển thị với khách hàng */}
          {roleName === "CUSTOMER" && (
            <Link className="cart-box" to="/cart">
              <div className="cart-icon">
                <i className="fa-solid fa-cart-shopping"></i>
                <span>{cartCount}</span>
              </div>
              <p>Giỏ hàng</p>
            </Link>
          )}

          {/* Hiển thị tài khoản hoặc nút đăng nhập/đăng ký */}
          {account ? (
            <div className="user-dropdown">
              <button className="dropdown-toggle" type="button">
                <div className="user-icon">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <h4>{fullName}</h4>
                  <p>{roleName === "ADMIN" ? "Admin" : "Khách hàng"}</p>
                </div>
              </button>
              <div className="dropdown-menu">
                <Link to="/profile">
                  <i className="fa-regular fa-id-card"></i> Thông tin cá nhân
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
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
  );
}
