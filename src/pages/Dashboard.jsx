import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";

const isActive = (item) => item.status !== "INACTIVE";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedRange, setAppliedRange] = useState({ from: "", to: "" });
  const [dateError, setDateError] = useState("");
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [products, ordersData, categories, brands] = await Promise.all([
          getCollection("products"),
          getCollection("orders"),
          getCollection("categories"),
          getCollection("brands"),
        ]);

        const activeProducts = products.filter(isActive);

        setStats({
          products: activeProducts.length,
          categories: categories.filter(isActive).length,
          brands: brands.filter(isActive).length,
          lowStock: activeProducts.filter(
            (product) => Number(product.stock) < 10,
          ).length,
        });
        setOrders(ordersData);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (!appliedRange.from && !appliedRange.to) return true;

    const orderDate = order.date?.slice(0, 10);
    if (!orderDate) return false;

    return (
      (!appliedRange.from || orderDate >= appliedRange.from) &&
      (!appliedRange.to || orderDate <= appliedRange.to)
    );
  });

  const filteredRevenue = filteredOrders
    .filter((order) => order.status === "Đã giao hàng")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const handleDateFilter = (event) => {
    event.preventDefault();

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    setDateError("");
    setAppliedRange({ from: dateFrom, to: dateTo });
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedRange({ from: "", to: "" });
    setDateError("");
  };

  const summaryRows = [
    {
      label: "Sản phẩm đang hoạt động",
      value: stats.products,
      to: "/admin/products",
      action: "Quản lý",
    },
    {
      label: "Đơn hàng",
      value: filteredOrders.length,
      to: "/admin/orders",
      action: "Quản lý",
    },
    {
      label: "Danh mục đang hoạt động",
      value: stats.categories,
      to: "/admin/categories",
      action: "Quản lý",
    },
    {
      label: "Thương hiệu đang hoạt động",
      value: stats.brands,
      to: "/admin/brands",
      action: "Quản lý",
    },
    {
      label: "Sản phẩm sắp hết hàng",
      value: stats.lowStock,
      to: "/admin/products",
      action: "Kiểm tra",
    },
    {
      label: "Doanh thu đơn đã giao",
      value: `${filteredRevenue.toLocaleString("vi-VN")}đ`,
      to: "/admin/orders",
      action: "Xem đơn hàng",
    },
  ];

  return (
    <main className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            {loading
              ? "Đang tải dữ liệu tổng quan..."
              : error || "Tổng quan hoạt động cửa hàng ProBuild PC"}
          </p>
        </div>

        <form className="dashboard-date-filter" onSubmit={handleDateFilter}>
          <label>
            Từ ngày
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <button type="submit">Lọc</button>
          <button type="button" className="clear" onClick={clearDateFilter}>
            Xóa lọc
          </button>
        </form>
      </div>

      {dateError && <p className="dashboard-filter-error">{dateError}</p>}

      <section className="dashboard-table-wrap">
        <table className="dashboard-summary-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Chỉ số</th>
              <th>Giá trị</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, index) => (
              <tr key={row.label}>
                <td>{index + 1}</td>
                <td>{row.label}</td>
                <td>{row.value}</td>
                <td>
                  <Link to={row.to}>{row.action}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
