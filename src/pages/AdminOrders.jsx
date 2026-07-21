import { useEffect, useState } from "react";
import { getCollection, updateItem } from "../services/api";
import { getStoredAccount } from "../utils/cartStorage";
import "../assets/css/admin-order.css";

// Danh sách trạng thái đơn hàng
const ORDER_STATUSES = [
  "Đang xử lý",
  "Đang giao hàng",
  "Đã giao hàng",
  "Đã hủy",
];

// Quy định các trạng thái được phép chuyển tiếp
const ALLOWED_TRANSITIONS = {
  "Đang xử lý": ["Đang giao hàng", "Đã hủy"],
  "Đang giao hàng": ["Đã giao hàng"],
  "Đã giao hàng": [],
  "Đã hủy": [],
};

export default function AdminOrders() {
  // Dữ liệu đơn hàng, người dùng và các điều kiện lọc
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [updatingOrderIds, setUpdatingOrderIds] = useState([]);

  // Tải dữ liệu khi trang được mở
  useEffect(() => {
    loadOrders();
  }, []);

  // Lấy danh sách đơn hàng và người dùng từ API
  const loadOrders = async () => {
    const ordersData = await getCollection("orders");
    const usersData = await getCollection("users");

    setOrders(ordersData);
    setUsers(usersData);
  };

  // Định dạng giá tiền theo đơn vị Việt Nam
  const formatPrice = (price) => Number(price).toLocaleString("vi-VN") + "đ";

  // Tìm tên khách hàng theo ID tài khoản
  const getCustomerName = (userId) => {
    const user = users.find((item) => Number(item.id) === Number(userId));
    return user ? user.fullName : `Không tìm thấy tài khoản`;
  };

  // Cập nhật trạng thái đơn và hoàn kho nếu đơn bị hủy
  const handleChangeStatus = async (order, status) => {
    if (status === order.status) return;
    if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(status)) {
      alert("Không thể chuyển sang trạng thái này!");
      return;
    }
    if (updatingOrderIds.includes(order.id)) return;

    setUpdatingOrderIds((current) => [...current, order.id]);
    const adjustedProducts = [];

    try {
      // Cộng lại tồn kho một lần khi chuyển đơn sang trạng thái đã hủy
      if (status === "Đã hủy" && !order.stockRestored) {
        const products = await getCollection("products");

        for (const orderItem of order.items || []) {
          const productId = Number(orderItem.productId ?? orderItem.id);
          const quantity = Number(orderItem.quantity);
          const product = products.find(
            (item) => Number(item.id) === productId,
          );

          if (!product || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Dữ liệu sản phẩm trong đơn hàng không hợp lệ.");
          }

          const originalStock = Number(product.stock);
          await updateItem("products", product.id, {
            stock: originalStock + quantity,
          });
          adjustedProducts.push({ id: product.id, stock: originalStock });
        }
      }

      // Lưu trạng thái mới, thời gian và lịch sử người thực hiện
      const now = new Date().toISOString();
      const currentAdmin = getStoredAccount();
      const updatedOrder = await updateItem("orders", order.id, {
        status,
        updatedAt: now,
        ...(status === "Đã hủy"
          ? { stockRestored: true, cancelledAt: now }
          : {}),
        ...(status === "Đã giao hàng" ? { deliveredAt: now } : {}),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status,
            changedAt: now,
            changedBy: currentAdmin?.id ?? null,
          },
        ],
      });

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, ...updatedOrder } : item,
        ),
      );
    } catch (err) {
      console.error(err);

      // Khôi phục tồn kho cũ nếu quá trình cập nhật đơn thất bại
      if (adjustedProducts.length) {
        await Promise.allSettled(
          adjustedProducts.map((product) =>
            updateItem("products", product.id, { stock: product.stock }),
          ),
        );
      }
      alert(err.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingOrderIds((current) =>
        current.filter((id) => id !== order.id),
      );
    }
  };

  // Lọc đơn hàng theo ID và trạng thái
  const filteredOrders = orders.filter((order) => {
    const matchId =
      keyword.trim() === "" || String(order.id).includes(keyword.trim());

    const matchStatus = statusFilter === "" || order.status === statusFilter;

    return matchId && matchStatus;
  });

  return (
    <main className="admin-page">
      <h1>Quản lý đơn hàng</h1>

      {/* Bộ lọc theo ID và trạng thái đơn hàng */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo ID đơn hàng..."
          style={{
            height: "42px",
            width: "260px",
            padding: "0 12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontWeight: "bold",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: "42px",
            width: "220px",
            padding: "0 12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontWeight: "bold",
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đang giao hàng">Đang giao hàng</option>
          <option value="Đã giao hàng">Đã giao hàng</option>
          <option value="Đã hủy">Đã hủy</option>
        </select>
      </div>

      {/* Bảng danh sách và chi tiết đơn hàng */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Địa chỉ</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{getCustomerName(order.userId)}</td>
                <td>{order.phone}</td>
                <td>{order.address}</td>

                <td className="admin-order-items ">
                  {order.items?.map((item) => (
                    <div
                      key={item.productId ?? item.id}
                      className="admin-order-product"
                      style={{ marginTop: "5px" }}
                    >
                      <strong>{item.productName ?? item.name}</strong>
                      <br />
                      <span>Số lượng: {item.quantity}</span>
                      <br />
                      <span>
                        Giá tiền 1 sản phẩm:{" "}
                        {formatPrice(item.unitPrice ?? item.price)}
                      </span>
                    </div>
                  ))}
                </td>

                <td>{formatPrice(order.totalPrice)}</td>

                <td>
                  {/* Chỉ hiển thị những trạng thái được phép chuyển đến */}
                  <select
                    className="admin-status-select"
                    value={order.status}
                    onChange={(e) => handleChangeStatus(order, e.target.value)}
                    disabled={updatingOrderIds.includes(order.id)}
                  >
                    {ORDER_STATUSES.filter(
                      (status) =>
                        status === order.status ||
                        (ALLOWED_TRANSITIONS[order.status] || []).includes(status),
                    ).map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>

                <td>{new Date(order.date).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}

            {/* Thông báo khi không có đơn hàng phù hợp */}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
