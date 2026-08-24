import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCollection } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    document.body.className = "login-page";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const users = await getCollection("users");

      const user = (users || []).find(
        (item) =>
          item.email?.trim().toLowerCase() === email.trim().toLowerCase() &&
          String(item.password).trim() === password.trim(),
      );

      if (user) {
        login(user);
        toast.success(`Chào mừng ${user.fullName || user.username} đã quay trở lại!`);
        if (user.role === "ADMIN") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError("Tài khoản hoặc mật khẩu không chính xác!");
        toast.error("Đăng nhập thất bại: Sai email hoặc mật khẩu!");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-back-link">
        <i className="fa-solid fa-arrow-left"></i>
        Trang chủ
      </Link>

      <section className="auth-card auth-card-compact">
        <div className="auth-card-header">
          <div className="auth-logo">P</div>
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng.</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input">
              <i className="fa-regular fa-envelope auth-input-icon"></i>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="auth-input">
              <i className="fa-solid fa-lock auth-input-icon"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <i
                  className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <div className="forgot-password-container">
            <Link to="/forgot-password" className="forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {error && <div className="auth-message error">{error}</div>}

        <div className="auth-footer">
          Bạn chưa có tài khoản?
          <Link to="/register"> Đăng ký ngay</Link>
        </div>
      </section>
    </main>
  );
}
