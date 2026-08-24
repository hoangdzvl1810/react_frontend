import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCollection, updateItem } from "../services/api";
import emailjs from '@emailjs/browser';

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function ForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // OTP States
  const [step, setStep] = useState("FORM"); // "FORM" or "OTP"
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiredTime, setOtpExpiredTime] = useState(null);
  const [matchedUserId, setMatchedUserId] = useState(null);

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

  const handleRequestOtp = async (event) => {
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
        (item) => normalizeEmail(item.email || "") === normalizeEmail(form.email),
      );

      if (!user) {
        setError("Email này chưa được đăng ký trong hệ thống.");
        return;
      }

      setMatchedUserId(user.id);

      // Tự động tạo OTP 6 số
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setOtpExpiredTime(Date.now() + 2 * 60 * 1000); // Mã có hiệu lực trong 2 phút

      // Gửi email qua EmailJS
      const templateParams = {
        to_email: normalizeEmail(form.email),
        to_name: user.fullName?.trim() || "Khách hàng",
        otp_code: newOtp,
      };

      try {
        await emailjs.send(
          'service_o5krgnr',
          'template_f6ilju8',
          templateParams,
          'MkQTJJanpQbaDaVVZ'
        );
        console.log("Đã gửi email OTP đổi mật khẩu thành công qua EmailJS");
      } catch (emailError) {
        console.error("Lỗi khi gửi email:", emailError);
        console.error("CHI TIẾT LỖI TỪ EMAILJS:", emailError?.text || emailError?.message || emailError);
      }

      setSuccess("Mã OTP đã được gửi đến email của bạn.");
      setStep("OTP");
    } catch (requestError) {
      setError("Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpAndReset = async (event) => {
    event.preventDefault();
    setError("");

    if (Date.now() > otpExpiredTime) {
      setError("Mã OTP đã hết hạn (quá 2 phút). Vui lòng thử lại từ đầu.");
      return;
    }

    if (otp !== generatedOtp) {
      setError("Mã OTP không chính xác.");
      return;
    }

    try {
      setSubmitting(true);
      const updatedUser = await updateItem("users", matchedUserId, {
        password: form.newPassword,
      });

      const storedAccount = JSON.parse(localStorage.getItem("account"));
      if (storedAccount && String(storedAccount.id) === String(matchedUserId)) {
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
          <h1>{step === "FORM" ? "Quên mật khẩu" : "Xác nhận OTP"}</h1>
          <p>
            {step === "FORM"
              ? "Nhập email đã đăng ký để nhận mã OTP tạo mật khẩu mới."
              : "Vui lòng nhập mã OTP 6 số vừa được gửi đến email của bạn."}
          </p>
        </div>

        {step === "FORM" ? (
          <form className="auth-form" onSubmit={handleRequestOtp}>
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
              {submitting ? "Đang gửi OTP..." : "Tiếp tục & Nhận OTP"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtpAndReset}>
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
              {submitting ? "Đang xác nhận..." : "Xác nhận & Đổi mật khẩu"}
            </button>

            <button
              type="button"
              className="auth-submit"
              style={{ marginTop: "10px", backgroundColor: "#6c757d" }}
              onClick={() => {
                setStep("FORM");
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

        {step === "FORM" && (
          <div className="auth-footer">
            Đã nhớ mật khẩu?
            <Link to="/login"> Đăng nhập</Link>
          </div>
        )}
      </section>
    </main>
  );
}
