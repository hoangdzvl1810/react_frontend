import { useEffect, useState, useMemo } from "react";
import { getCollection, updateItem } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OrderDetailsModal, ConfirmModal } from "../components/Modal";
import Pagination from "../components/Pagination";
import "../assets/css/admin-order.css";

const ITEMS_PER_PAGE = 9;

const ORDER_STATUSES = [
  "Đang xử lý",
  "Đang giao hàng",
  "Đã giao hàng",
  "Đã hủy",
];

const ALLOWED_TRANSITIONS = {
  "Đang xử lý": ["Đang giao hàng", "Đã hủy"],
  "Đang giao hàng": ["Đã giao hàng"],
  "Đã giao hàng": [],
  "Đã hủy": [],
};

export default function AdminOrders() {
  const { account: currentAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [updatingOrderIds, setUpdatingOrderIds] = useState([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toast = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const [ordersData, usersData] = await Promise.all([
        getCollection("orders"),
        getCollection("users"),
      ]);
      setOrders(ordersData || []);
      setUsers(usersData || []);
    } catch (e) {
      toast.error("Không thể tải danh sách đơn hàng.");
    }
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString("vi-VN") + "đ";

  const getCustomerName = (userId) => {
    const user = users.find((item) => Number(item.id) === Number(userId));
    return user ? user.fullName : "Khách vãng lai";
  };

  const requestStatusChange = (order, nextStatus) => {
    if (nextStatus === order.status) return;
    if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(nextStatus)) {
      toast.warning("Không thể chuyển sang trạng thái này theo quy trình!");
      return;
    }
    setPendingStatusChange({ order, nextStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { order, nextStatus } = pendingStatusChange;
    setPendingStatusChange(null);

    if (updatingOrderIds.includes(order.id)) return;

    setUpdatingOrderIds((current) => [...current, order.id]);
    const adjustedProducts = [];

    try {
      if (nextStatus === "Đã hủy" && !order.stockRestored) {
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

      const now = new Date().toISOString();
      const updatedOrder = await updateItem("orders", order.id, {
        status: nextStatus,
        updatedAt: now,
        ...(nextStatus === "Đã hủy"
          ? { stockRestored: true, cancelledAt: now }
          : {}),
        ...(nextStatus === "Đã giao hàng"
          ? { deliveredAt: now, paymentStatus: "Đã thanh toán" }
          : {}),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: nextStatus,
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

      toast.success(`Đã cập nhật đơn hàng #${order.id} sang "${nextStatus}"`);
    } catch (err) {
      console.error(err);
      if (adjustedProducts.length) {
        await Promise.allSettled(
          adjustedProducts.map((product) =>
            updateItem("products", product.id, { stock: product.stock }),
          ),
        );
      }
      toast.error(err.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingOrderIds((current) =>
        current.filter((id) => id !== order.id),
      );
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter]);

  const filteredOrders = useMemo(() => {
    const term = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const matchId = !term || String(order.id).toLowerCase().includes(term);
      const matchPhone = !term || String(order.phone || "").toLowerCase().includes(term);
      const matchCustomer =
        !term ||
        getCustomerName(order.userId).toLowerCase().includes(term) ||
        String(order.customerName || "").toLowerCase().includes(term);
      const matchAddress =
        !term || String(order.address || "").toLowerCase().includes(term);

      const matchesSearch = matchId || matchPhone || matchCustomer || matchAddress;
      const matchStatus = statusFilter === "" || order.status === statusFilter;

      return matchesSearch && matchStatus;
    });
  }, [orders, keyword, statusFilter, users]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <main className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: "20px" }}>
        <h1>Quản lý đơn hàng</h1>
        <p style={{ color: "#64748b", marginTop: "4px" }}>
          Theo dõi, xử lý và in hóa đơn cho các đơn hàng của khách hàng.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo ID, Tên, SĐT, Địa chỉ..."
            style={{
              height: "42px",
              width: "320px",
              padding: "0 12px 0 36px",
              borderRadius: "8px",
              border: "1.5px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          ></i>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: "42px",
            width: "220px",
            padding: "0 12px",
            borderRadius: "8px",
            border: "1.5px solid #cbd5e1",
            fontWeight: "600",
            fontSize: "14px",
            background: "#ffffff",
          }}
        >
          <option value="">Tất cả trạng thái ({orders.length})</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đang giao hàng">Đang giao hàng</option>
          <option value="Đã giao hàng">Đã giao hàng</option>
          <option value="Đã hủy">Đã hủy</option>
        </select>
      </div>

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
              <th style={{ textAlign: "center" }}>Chi tiết / In</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: "700" }}>#{order.id}</td>
                <td>
                  <strong>{getCustomerName(order.userId)}</strong>
                </td>
                <td>{order.phone}</td>
                <td style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                  {order.address}
                </td>

                <td className="admin-order-items">
                  {order.items?.map((item) => (
                    <div
                      key={item.productId ?? item.id}
                      className="admin-order-product"
                      style={{ marginTop: "4px", fontSize: "13px" }}
                    >
                      <span>• {item.productName ?? item.name}</span>{" "}
                      <strong>(x{item.quantity})</strong>
                    </div>
                  ))}
                </td>

                <td style={{ color: "#dc2626", fontWeight: "800" }}>
                  {formatPrice(order.totalPrice)}
                </td>

                <td>
                  <select
                    className="admin-status-select"
                    value={order.status}
                    onChange={(e) => requestStatusChange(order, e.target.value)}
                    disabled={updatingOrderIds.includes(order.id)}
                    style={{
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
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

                <td style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="btn-view-quick"
                    onClick={() => setSelectedOrderForDetail(order)}
                    style={{
                      padding: "6px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <i className="fa-solid fa-file-invoice"></i> Xem đơn
                  </button>
                </td>
              </tr>
            ))}

            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px" }}>
                  Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredOrders.length}
        pageSize={ITEMS_PER_PAGE}
      />

      {/* Order details & invoice modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderForDetail)}
        order={selectedOrderForDetail}
        customerName={
          selectedOrderForDetail
            ? getCustomerName(selectedOrderForDetail.userId)
            : ""
        }
        onClose={() => setSelectedOrderForDetail(null)}
      />

      {/* Confirm Status Change Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingStatusChange)}
        title="Xác nhận chuyển trạng thái"
        message={`Bạn có chắc chắn muốn chuyển đơn hàng #${pendingStatusChange?.order?.id} sang trạng thái "${pendingStatusChange?.nextStatus}"?`}
        confirmText="Xác nhận đổi"
        cancelText="Hủy bỏ"
        type={pendingStatusChange?.nextStatus === "Đã hủy" ? "danger" : "primary"}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </main>
  );
}
