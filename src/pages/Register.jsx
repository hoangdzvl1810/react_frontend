import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createItem, getCollection } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // OTP States
  const [step, setStep] = useState("REGISTER"); // "REGISTER" or "OTP"
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = "register-page";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 8 || password.length > 31) {
      return "Mật khẩu phải từ 8 đến 31 ký tự.";
    }

    if (!hasUpperCase) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa.";
    }

    if (!hasLowerCase) {
      return "Mật khẩu phải có ít nhất 1 chữ thường.";
    }

    if (!hasNumber) {
      return "Mật khẩu phải có ít nhất 1 số.";
    }

    return "";
  };

  const handleRegisterClick = async (e) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    const passwordError = validatePassword(form.password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      const users = await getCollection("users");
      const existedUser = users.find(
        (user) => user.email?.toLowerCase() === email,
      );

      if (existedUser) {
        setError("Email này đã được đăng ký.");
        setSubmitting(false);
        return;
      }

      // Tự động tạo OTP 6 số
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      
      // Giả lập việc gửi email (Trong React frontend không có backend thật, ta sẽ dùng alert/console)
      alert("Mô phỏng gửi Email OTP: Mã OTP của bạn là " + newOtp);
      
      setSuccess("Mã OTP đã được gửi đến email của bạn.");
      setStep("OTP");
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (otp !== generatedOtp) {
      setError("Mã OTP không chính xác.");
      return;
    }

    try {
      setSubmitting(true);
      const fullName = form.fullName.trim();
      const email = form.email.trim().toLowerCase();

      const newUser = await createItem("users", {
        fullName,
        email,
        password: form.password,
        role: "CUSTOMER",
      });

      localStorage.setItem("account", JSON.stringify(newUser));
      setSuccess("Đăng ký thành công! Đang chuyển về trang chủ...");

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 700);
    } catch (err) {
      setError("Không thể đăng ký lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-back-link">
        <i className="fa-solid fa-arrow-left"></i>
        Trang chủ
      </Link>

      <section className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">P</div>
          <h1>{step === "REGISTER" ? "Tạo tài khoản" : "Xác nhận OTP"}</h1>
          <p>
            {step === "REGISTER" 
              ? "Đăng ký để đặt hàng, theo dõi đơn và lưu giỏ hàng của bạn."
              : "Vui lòng nhập mã OTP 6 số vừa được gửi đến email của bạn."}
          </p>
        </div>

        {step === "REGISTER" ? (
          <form className="auth-form" onSubmit={handleRegisterClick}>
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
                  placeholder="Nhập họ và tên"
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
                  placeholder="Nhập email"
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
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="8-31 ký tự, có chữ hoa, chữ thường và số"
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

            <div className="auth-field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="auth-input">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Ẩn mật khẩu xác nhận"
                      : "Hiện mật khẩu xác nhận"
                  }
                >
                  <i
                    className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-field">
              <label htmlFor="otp">Mã xác nhận</label>
              <div className="auth-input">
                <i className="fa-solid fa-key auth-input-icon"></i>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập mã OTP (6 số)"
                  maxLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Đang xác nhận..." : "Xác nhận OTP"}
            </button>
            <button 
              type="button" 
              className="auth-submit" 
              style={{marginTop: "10px", backgroundColor: "#6c757d"}}
              onClick={() => {
                setStep("REGISTER");
                setSuccess("");
                setError("");
                setOtp("");
              }}
            >
              Quay lại
            </button>
          </form>
        )}

        {error && <div className="auth-message error">{error}</div>}

        {success && <div className="auth-message success">{success}</div>}

        {step === "REGISTER" && (
          <div className="auth-footer">
            Bạn đã có tài khoản?
            <Link to="/login"> Đăng nhập</Link>
          </div>
        )}
      </section>
    </main>
  );
}
