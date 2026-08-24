import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";
import { OrderDetailsModal } from "../components/Modal";
import { getProductImage } from "../utils/productImages";

const isActive = (item) => item.status !== "INACTIVE";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);

  // Time range filtering
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | '7d' | '30d' | 'custom'
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Modal for quick order view
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [prodsData, ordersData, catsData, brandsData, usersData] =
          await Promise.all([
            getCollection("products"),
            getCollection("orders"),
            getCollection("categories"),
            getCollection("brands"),
            getCollection("users"),
          ]);

        setProducts(prodsData || []);
        setOrders(ordersData || []);
        setCategories(catsData || []);
        setBrands(brandsData || []);
        setUsers(usersData || []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu dashboard. Đang hiển thị dữ liệu dự phòng.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Filtered orders based on selected time window
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      if (!order.date) return false;
      const orderDate = new Date(order.date);

      if (timeFilter === "7d") {
        const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= past7Days;
      }
      if (timeFilter === "30d") {
        const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= past30Days;
      }
      if (timeFilter === "custom") {
        const dateStr = order.date.slice(0, 10);
        if (customFrom && dateStr < customFrom) return false;
        if (customTo && dateStr > customTo) return false;
        return true;
      }
      return true;
    });
  }, [orders, timeFilter, customFrom, customTo]);

  // Key metrics
  const activeProducts = useMemo(() => products.filter(isActive), [products]);
  const lowStockProducts = useMemo(
    () => activeProducts.filter((p) => Number(p.stock) < 10),
    [activeProducts]
  );

  const totalDeliveredRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === "Đã giao hàng")
      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  }, [filteredOrders]);

  const orderStatusCounts = useMemo(() => {
    const counts = {
      processing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };
    filteredOrders.forEach((o) => {
      if (o.status === "Đang xử lý") counts.processing++;
      else if (o.status === "Đang giao hàng") counts.shipping++;
      else if (o.status === "Đã giao hàng") counts.delivered++;
      else if (o.status === "Đã hủy") counts.cancelled++;
    });
    return counts;
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6);
  }, [orders]);

  const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN") + "đ";

  const getCustomerName = (userId) => {
    const u = users.find((item) => Number(item.id) === Number(userId));
    return u ? u.fullName : "Khách vãng lai";
  };

  const totalOrdersCount = filteredOrders.length || 1;

  return (
    <main className="dashboard-modern-wrap">
      {/* Top Header */}
      <div className="dashboard-hero-bar">
        <div className="dashboard-title-area">
          <h1>Admin Dashboard</h1>
          <p>
            {loading
              ? "Đang nạp dữ liệu thống kê..."
              : error || "Tổng quan tình hình kinh doanh hệ thống linh kiện ProBuild PC"}
          </p>
        </div>

        <div className="dashboard-filter-chips">
          <button
            type="button"
            className={`filter-chip-btn ${timeFilter === "all" ? "active" : ""}`}
            onClick={() => setTimeFilter("all")}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`filter-chip-btn ${timeFilter === "7d" ? "active" : ""}`}
            onClick={() => setTimeFilter("7d")}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            className={`filter-chip-btn ${timeFilter === "30d" ? "active" : ""}`}
            onClick={() => setTimeFilter("30d")}
          >
            30 ngày qua
          </button>
          <button
            type="button"
            className={`filter-chip-btn ${timeFilter === "custom" ? "active" : ""}`}
            onClick={() => setTimeFilter("custom")}
          >
            Tùy chọn
          </button>

          {timeFilter === "custom" && (
            <div className="dashboard-custom-date">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span>-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <section className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-data">
            <span className="kpi-title">Doanh thu giao thành công</span>
            <div className="kpi-value">{formatPrice(totalDeliveredRevenue)}</div>
            <div className="kpi-subtitle">
              {orderStatusCounts.delivered} đơn hàng đã giao
            </div>
          </div>
        </div>

        <div className="kpi-card orders">
          <div className="kpi-data">
            <span className="kpi-title">Tổng số đơn hàng</span>
            <div className="kpi-value">{filteredOrders.length}</div>
            <div className="kpi-subtitle">
              {orderStatusCounts.processing} đang chờ xử lý
            </div>
          </div>
        </div>

        <div className="kpi-card products">
          <div className="kpi-data">
            <span className="kpi-title">Sản phẩm kinh doanh</span>
            <div className="kpi-value">{activeProducts.length}</div>
            <div className="kpi-subtitle">
              {categories.filter(isActive).length} danh mục | {brands.filter(isActive).length} thương hiệu
            </div>
          </div>
        </div>

        <div className="kpi-card lowstock">
          <div className="kpi-data">
            <span className="kpi-title">Cảnh báo tồn kho thấp</span>
            <div className="kpi-value">{lowStockProducts.length}</div>
            <div className="kpi-subtitle">Linh kiện có số lượng &lt; 10</div>
          </div>
        </div>
      </section>

      {/* Visual Charts Grid */}
      <section className="charts-grid">
        {/* Order Status Breakdown */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>
              <i className="fa-solid fa-pie-chart"></i> Phân bổ trạng thái đơn
            </h3>
          </div>

          <div className="status-breakdown-list">
            <div className="status-bar-item">
              <div className="status-meta">
                <span>Đang xử lý</span>
                <span>{orderStatusCounts.processing}</span>
              </div>
              <div className="status-track">
                <div
                  className="status-prog processing"
                  style={{
                    width: `${(orderStatusCounts.processing / totalOrdersCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="status-bar-item">
              <div className="status-meta">
                <span>Đang giao hàng</span>
                <span>{orderStatusCounts.shipping}</span>
              </div>
              <div className="status-track">
                <div
                  className="status-prog shipping"
                  style={{
                    width: `${(orderStatusCounts.shipping / totalOrdersCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="status-bar-item">
              <div className="status-meta">
                <span>Đã giao thành công</span>
                <span>{orderStatusCounts.delivered}</span>
              </div>
              <div className="status-track">
                <div
                  className="status-prog delivered"
                  style={{
                    width: `${(orderStatusCounts.delivered / totalOrdersCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="status-bar-item">
              <div className="status-meta">
                <span>Đã hủy</span>
                <span>{orderStatusCounts.cancelled}</span>
              </div>
              <div className="status-track">
                <div
                  className="status-prog cancelled"
                  style={{
                    width: `${(orderStatusCounts.cancelled / totalOrdersCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Grid: Recent Orders + Low Stock Alert */}
      <section className="bottom-tables-grid">
        {/* Recent Orders Table */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>
              <i className="fa-solid fa-clock-rotate-left"></i> Đơn hàng gần đây
            </h3>
            <Link to="/admin/orders" style={{ fontSize: "13px", color: "#2563eb", fontWeight: "600" }}>
              Xem tất cả →
            </Link>
          </div>

          <table className="dash-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((ord) => (
                <tr key={ord.id}>
                  <td style={{ fontWeight: "700" }}>#{ord.id}</td>
                  <td>{getCustomerName(ord.userId)}</td>
                  <td style={{ fontWeight: "700", color: "#dc2626" }}>
                    {formatPrice(ord.totalPrice)}
                  </td>
                  <td>
                    <span className={`badge-status status-${ord.status?.replace(/\s+/g, "")}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn-view-quick"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low Stock Items Alert */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>
              <i className="fa-solid fa-boxes-stacked"></i> Linh kiện sắp hết hàng
            </h3>
            <Link to="/admin/products" style={{ fontSize: "13px", color: "#2563eb", fontWeight: "600" }}>
              Quản lý kho →
            </Link>
          </div>

          <table className="dash-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.slice(0, 5).map((prod) => (
                <tr key={prod.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img
                        src={getProductImage(prod.image)}
                        alt={prod.name}
                        style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }}
                      />
                      <span style={{ fontWeight: "600" }}>{prod.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="stock-tag-danger">{prod.stock} còn lại</span>
                  </td>
                </tr>
              ))}
              {lowStockProducts.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "20px", color: "#16a34a" }}>
                    <i className="fa-solid fa-circle-check"></i> Kho hàng đều đảm bảo số lượng!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        customerName={selectedOrder ? getCustomerName(selectedOrder.userId) : ""}
        onClose={() => setSelectedOrder(null)}
      />
    </main>
  );
}
