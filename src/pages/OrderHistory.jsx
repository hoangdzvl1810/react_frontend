import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { OrderDetailsModal } from "../components/Modal";
import { getProductImage } from "../utils/productImages";

export default function OrderHistory() {
  const { account: user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getCollection("orders", {
          userId: user.id,
          _sort: "date",
          _order: "desc",
        });

        setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="cart-page-wrap">
        <div className="cart-empty-panel">
          <i className="fa-solid fa-lock cart-empty-icon"></i>
          <h2>Vui lòng đăng nhập</h2>
          <p>Đăng nhập để theo dõi trạng thái đơn hàng và lịch sử mua sắm của bạn.</p>
          <Link
            to="/login"
            className="cart-checkout-btn"
            style={{ display: "inline-block", width: "auto", padding: "12px 28px" }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="cart-page-wrap">
      <div className="cart-header-title">
        <h1>Lịch Sử Đơn Hàng Của Bạn</h1>
        <p>Theo dõi tiến trình xử lý, vận chuyển và xem lại chi tiết hóa đơn.</p>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "32px", marginBottom: "12px" }}></i>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="cart-empty-panel">
          <div className="cart-empty-icon">
            <i className="fa-solid fa-clipboard-list"></i>
          </div>
          <h2>Bạn chưa có đơn hàng nào!</h2>
          <p>Khám phá ngay các linh kiện máy tính chất lượng cao tại ProBuild PC.</p>
          <Link
            to="/categories"
            className="cart-checkout-btn"
            style={{ display: "inline-block", width: "auto", padding: "12px 28px" }}
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            border: "1px solid #f1f5f9",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  textAlign: "left",
                  backgroundColor: "#f8fafc",
                }}
              >
                <th style={{ padding: "14px 16px" }}>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "800", color: "#0f172a" }}>
                    #{order.id}
                  </td>
                  <td style={{ fontSize: "14px", color: "#64748b" }}>
                    {new Date(order.date).toLocaleString("vi-VN")}
                  </td>
                  <td>
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                          fontSize: "13px",
                        }}
                      >
                        {item.image && (
                          <img
                            src={getProductImage(item.image)}
                            alt={item.productName || item.name}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <span>
                          <strong>{item.productName ?? item.name}</strong> × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td style={{ color: "#dc2626", fontWeight: "800", fontSize: "15px" }}>
                    {Number(order.totalPrice).toLocaleString("vi-VN")}đ
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>
                      {order.paymentMethod === "BANK_TRANSFER"
                        ? "Chuyển khoản"
                        : "COD"}
                    </span>
                    <br />
                    <small
                      className={`badge-payment ${
                        order.paymentStatus === "Đã thanh toán"
                          ? "paid"
                          : "pending"
                      }`}
                    >
                      {order.paymentStatus || "Chưa thanh toán"}
                    </small>
                  </td>
                  <td>
                    <span className={`badge-status status-${order.status?.replace(/\s+/g, "")}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn-view-quick"
                      onClick={() => setSelectedOrder(order)}
                      style={{ padding: "8px 14px" }}
                    >
                      <i className="fa-solid fa-file-invoice"></i> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        customerName={user?.fullName}
        onClose={() => setSelectedOrder(null)}
      />
    </main>
  );
}
