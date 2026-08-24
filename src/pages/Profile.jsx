import { useState, useEffect } from "react";
import { updateItem } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import backgroundImage from "../assets/images/background.jpg";

export default function Profile() {
  const { account, updateAccount } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setFullName(account.fullName || account.username || "");
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account) return;

    if (fullName.trim() === "") {
      toast.error("Họ tên không được để trống!");
      return;
    }

    const payload = {
      fullName: fullName.trim(),
    };

    if (oldPassword || newPassword || confirmPassword) {
      if (oldPassword.trim() === "") {
        toast.error("Vui lòng nhập mật khẩu hiện tại!");
        return;
      }

      if (oldPassword !== account.password) {
        toast.error("Mật khẩu hiện tại không chính xác!");
        return;
      }

      if (newPassword.trim() === "") {
        toast.error("Mật khẩu mới không được để trống!");
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 31) {
        toast.error("Mật khẩu mới phải từ 8 đến 31 ký tự!");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Xác nhận mật khẩu mới không khớp!");
        return;
      }

      if (newPassword === oldPassword) {
        toast.error("Mật khẩu mới không được trùng mật khẩu cũ!");
        return;
      }

      payload.password = newPassword;
    }

    try {
      setSubmitting(true);
      const updatedUser = await updateItem("users", account.id, payload);
      updateAccount(updatedUser);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật thông tin lúc này!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <main
      style={{
        minHeight: "78vh",
        background: "#f5f7fb",
        padding: "42px 0",
      }}
    >
      <section
        style={{
          width: "min(1180px, calc(100% - 48px))",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          background: "#fff",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            minHeight: "680px",
            backgroundImage: `linear-gradient(
  rgba(0,0,0,.2),
  rgba(0,0,0,.55)
), url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "flex-end",
            padding: "42px",
            color: "#fff",
          }}
        >
          <div>
            <h1 style={{ fontSize: "42px", marginBottom: "14px" }}>
              ProBuild PC
            </h1>
            <p
              style={{ fontSize: "18px", lineHeight: "1.7", maxWidth: "520px" }}
            >
              Quản lý thông tin cá nhân, bảo mật tài khoản và cập nhật hồ sơ của
              bạn.
            </p>
          </div>
        </div>

        <div style={{ padding: "56px 52px" }}>
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
            Thông tin cá nhân
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "40px" }}>
            Cập nhật họ tên hoặc thay đổi mật khẩu khi cần.
          </p>

          <form onSubmit={handleSubmit}>
            <ProfileField label="Email">
              <input
                type="text"
                value={account.email || ""}
                readOnly
                style={inputStyle}
              />
              <i className="fa-solid fa-lock" style={iconStyle}></i>
            </ProfileField>

            <ProfileField label="Họ tên">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
              <i className="fa-solid fa-user" style={iconStyle}></i>
            </ProfileField>

            <ProfileField label="Mật khẩu cũ">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                style={inputStyle}
              />
              <i className="fa-solid fa-key" style={iconStyle}></i>
            </ProfileField>

            <ProfileField label="Mật khẩu mới">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8-31 ký tự, có chữ hoa, thường và số"
                style={inputStyle}
              />
              <i className="fa-solid fa-lock-open" style={iconStyle}></i>
            </ProfileField>

            <ProfileField label="Xác nhận mật khẩu mới">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                style={inputStyle}
              />
              <i className="fa-solid fa-check-double" style={iconStyle}></i>
            </ProfileField>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "22px",
                width: "250px",
                height: "50px",
                background: "#b91c1c",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <i className="fa-solid fa-floppy-disk"></i> {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ProfileField({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "700",
          color: "#111827",
        }}
      >
        {label}
      </label>

      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: "46px",
  padding: "0 44px 0 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  outline: "none",
  fontSize: "15px",
};

const iconStyle = {
  position: "absolute",
  right: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
};
