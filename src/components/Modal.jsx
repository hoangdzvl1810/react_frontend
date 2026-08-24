import React, { useState, useEffect } from "react";
import { getProductImage } from "../utils/productImages";

export function ConfirmModal({
  isOpen,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
  type = "danger", // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className={`modal-icon-badge ${type}`}>
            <i
              className={
                type === "danger"
                  ? "fa-solid fa-triangle-exclamation"
                  : type === "warning"
                    ? "fa-solid fa-circle-exclamation"
                    : "fa-solid fa-circle-check"
              }
            ></i>
          </div>
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onCancel} type="button">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`modal-btn-confirm ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({
  isOpen,
  title = "Chỉnh sửa thông tin",
  label = "Giá trị mới",
  defaultValue = "",
  placeholder = "Nhập giá trị...",
  inputType = "text",
  confirmText = "Lưu thay đổi",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  validate,
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(defaultValue);
    setError("");
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setValue(newVal);

    if (inputType === "number") {
      const num = Number(newVal);
      if (newVal !== "" && (isNaN(num) || num < 0)) {
        setError("Giá trị phải là số không âm!");
        return;
      }
    } else {
      if (/\s{2,}/.test(newVal)) {
        setError("Tên không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
        return;
      }
    }

    if (validate) {
      const customErr = validate(newVal);
      if (customErr) {
        setError(customErr);
        return;
      }
    }

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputType === "number") {
      const num = Number(value);
      if (value === "" || isNaN(num) || num < 0) {
        setError("Giá trị phải là số không âm!");
        return;
      }
    } else if (!value.trim()) {
      setError("Vui lòng không để trống trường này!");
      return;
    } else if (/\s{2,}/.test(value)) {
      setError("Tên không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    if (validate) {
      const customErr = validate(value);
      if (customErr) {
        setError(customErr);
        return;
      }
    }

    onConfirm(value);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close-btn" onClick={onCancel} type="button">
              ×
            </button>
          </div>
          <div className="modal-body">
            <label className="modal-field-label">{label}</label>
            <input
              type={inputType}
              value={value}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="modal-input"
              autoFocus
            />
            {error && <span className="modal-error-text">{error}</span>}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button type="submit" className="modal-btn-confirm primary">
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OrderDetailsModal({
  isOpen,
  order,
  customerName,
  onClose,
  onUpdateStatus,
}) {
  if (!isOpen || !order) return null;

  const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN") + "đ";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-card-large printable-order-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>Chi tiết đơn hàng #{order.id}</h3>
            <span className="order-modal-subtitle">
              Ngày đặt: {new Date(order.date).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="modal-actions-top">
            <button
              type="button"
              className="btn-print-invoice"
              onClick={handlePrint}
              title="In hóa đơn"
            >
              <i className="fa-solid fa-print"></i> In đơn
            </button>
            <button className="modal-close-btn" onClick={onClose} type="button">
              ×
            </button>
          </div>
        </div>

        <div className="modal-body modal-body-scrollable">
          {/* Customer & Shipping Details */}
          <div className="order-detail-grid">
            <div className="order-info-card">
              <h4>
                <i className="fa-solid fa-user"></i> Người nhận hàng
              </h4>
              <p>
                <strong>Khách hàng:</strong> {customerName || order.customerName || "N/A"}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {order.phone}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {order.address}
              </p>
            </div>

            <div className="order-info-card">
              <h4>
                <i className="fa-solid fa-credit-card"></i> Thông tin thanh toán
              </h4>
              <p>
                <strong>Phương thức:</strong>{" "}
                {order.paymentMethod === "BANK_TRANSFER"
                  ? "Chuyển khoản ngân hàng"
                  : "Thanh toán khi nhận hàng (COD)"}
              </p>
              <p>
                <strong>Trạng thái thanh toán:</strong>{" "}
                <span
                  className={`badge-payment ${order.paymentStatus === "Đã thanh toán"
                      ? "paid"
                      : "pending"
                    }`}
                >
                  {order.paymentStatus || "Chưa thanh toán"}
                </span>
              </p>
              <p>
                <strong>Trạng thái đơn:</strong>{" "}
                <span className={`badge-status status-${order.status?.replace(/\s+/g, "")}`}>
                  {order.status}
                </span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>
            <i className="fa-solid fa-boxes-stacked"></i> Danh sách sản phẩm
          </h4>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th style={{ textAlign: "right" }}>Đơn giá</th>
                <th style={{ textAlign: "center" }}>Số lượng</th>
                <th style={{ textAlign: "right" }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <div className="order-product-cell">
                      {item.image && (
                        <img
                          src={getProductImage(item.image)}
                          alt={item.productName || item.name}
                          className="order-product-thumb"
                        />
                      )}
                      <div>
                        <strong>{item.productName ?? item.name}</strong>
                        <small className="order-product-id">
                          Mã: #{item.productId ?? item.id}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatPrice(item.unitPrice ?? item.price)}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "600" }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right", color: "#e53e3e", fontWeight: "700" }}>
                    {formatPrice(
                      item.lineTotal ??
                      (item.unitPrice ?? item.price) * item.quantity
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: "700" }}>
                  Tổng tiền thanh toán:
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: "#dc2626",
                    fontWeight: "800",
                    fontSize: "18px",
                  }}
                >
                  {formatPrice(order.totalPrice)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Status Timeline if available */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="order-timeline-section">
              <h4>
                <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử trạng thái
              </h4>
              <div className="order-timeline">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-info">
                      <strong>{h.status}</strong>
                      <span>{new Date(h.changedAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
