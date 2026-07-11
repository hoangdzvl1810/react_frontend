import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCollection, updateItem } from "../services/api";

const normalizeFullName = (value) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function ForgotPassword() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = "forgot-password-page";
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword.length < 8 || form.newPassword.length > 31) {
      setError("Mật khẩu mới phải từ 8 đến 31 ký tự.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Hai lần nhập mật khẩu mới không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const users = await getCollection("users");
      const user = users.find(
        (item) =>
          normalizeFullName(item.fullName || "") ===
            normalizeFullName(form.fullName) &&
          normalizeEmail(item.email || "") === normalizeEmail(form.email),
      );

      if (!user) {
        setError("Sai thông tin họ tên hoặc email. Không thể đổi mật khẩu.");
        return;
      }

      const updatedUser = await updateItem("users", user.id, {
        password: form.newPassword,
      });

      const storedAccount = JSON.parse(localStorage.getItem("account"));
      if (storedAccount && String(storedAccount.id) === String(user.id)) {
        localStorage.setItem(
          "account",
          JSON.stringify({ ...storedAccount, ...updatedUser }),
        );
        window.dispatchEvent(new Event("accountUpdated"));
      }

      setSuccess("Đổi mật khẩu thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (requestError) {
      setError("Không thể đổi mật khẩu lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/login" className="auth-back-link">
        <i className="fa-solid fa-arrow-left"></i>
        Đăng nhập
      </Link>

      <section className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">P</div>
          <h1>Quên mật khẩu</h1>
          <p>
            Nhập đúng họ tên và email đã đăng ký để tạo mật khẩu mới.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="fullName">Họ và tên</label>
            <div className="auth-input">
              <i className="fa-regular fa-user auth-input-icon"></i>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên đã đăng ký"
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input">
              <i className="fa-regular fa-envelope auth-input-icon"></i>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Nhập email đã đăng ký"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="auth-input">
              <i className="fa-solid fa-lock auth-input-icon"></i>
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới (8-31 ký tự)"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowNewPassword((current) => !current)}
                aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
              >
                <i
                  className={`fa-regular ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Nhập lại mật khẩu mới</label>
            <div className="auth-input">
              <i className="fa-solid fa-lock auth-input-icon"></i>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword
                    ? "Ẩn mật khẩu nhập lại"
                    : "Hiện mật khẩu nhập lại"
                }
              >
                <i
                  className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "Đang kiểm tra..." : "Đổi mật khẩu"}
          </button>
        </form>

        {error && <div className="auth-message error">{error}</div>}
        {success && <div className="auth-message success">{success}</div>}

        <div className="auth-footer">
          Đã nhớ mật khẩu?
          <Link to="/login"> Đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}
