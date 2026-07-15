import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";
import { getStoredAccount } from "../utils/cartStorage";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const user = getStoredAccount();
      if (!user) return;

      try {
        const data = await getCollection("orders", {
          userId: user.id,
          _sort: "date",
          _order: "desc",
        });

        setOrders(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
  }, []);

  const user = getStoredAccount();

  if (!user) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Vui lòng đăng nhập để xem lịch sử đơn hàng.{" "}
        <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "60vh",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Lịch Sử Đơn Hàng Của Bạn</h2>

      {orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            backgroundColor: "#fff",
            borderRadius: "10px",
          }}
        >
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link
            to="/categories"
            className="btn-submit"
            style={{
              display: "inline-block",
              width: "200px",
              marginTop: "15px",
            }}
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #eee",
                  textAlign: "left",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <th style={{ padding: "15px" }}>Mã đơn hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>
                    #{order.id}
                  </td>
                  <td>{new Date(order.date).toLocaleString("vi-VN")}</td>
                  <td>
                    {order.items?.map((item) => (
                      <div key={item.productId ?? item.id}>
                        {item.productName ?? item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td style={{ color: "#e53e3e", fontWeight: "bold" }}>
                    {Number(order.totalPrice).toLocaleString("vi-VN")}đ
                  </td>
                  <td>
                    {order.paymentMethod === "BANK_TRANSFER"
                      ? "Chuyển khoản"
                      : "COD"}
                    <br />
                    <small>{order.paymentStatus || "Chưa thanh toán"}</small>
                  </td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
