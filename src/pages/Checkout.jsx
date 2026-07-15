import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createItem, getCollection, updateItem } from "../services/api";
import {
  clearBuyNowCart,
  clearCart,
  getStoredAccount,
  readBuyNowCart,
  readCart,
} from "../utils/cartStorage";

const normalizeAddress = (value) => value.trim().replace(/\s+/g, " ");
const normalizePhone = (value) => value.replace(/\s+/g, "");
const isVietnamesePhone = (value) => /^0(3|5|7|8|9)\d{8}$/.test(value);

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkoutLock = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get("type") === "buy-now";

  useEffect(() => {
    let active = true;

    const loadCheckout = async () => {
      try {
        setLoading(true);
        setError("");
        const storedCart = isBuyNow ? readBuyNowCart() : readCart();
        const products = await getCollection("products");
        const productMap = new Map(
          products.map((product) => [Number(product.id), product]),
        );
        const hydratedCart = storedCart
          .map((item) => {
            const product = productMap.get(Number(item.productId));
            if (!product || product.status === "INACTIVE") return null;
            return { ...product, quantity: item.quantity };
          })
          .filter(Boolean);

        if (hydratedCart.length !== storedCart.length) {
          setError("Một số sản phẩm đã ngừng bán hoặc không còn tồn tại.");
        }

        if (active) {
          setCart(hydratedCart);
          setUser(getStoredAccount());
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Không thể tải dữ liệu thanh toán.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCheckout();
    return () => {
      active = false;
    };
  }, [isBuyNow]);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const rollbackStocks = async (adjustedProducts) => {
    await Promise.allSettled(
      adjustedProducts.map(({ id, stock }) =>
        updateItem("products", id, { stock }),
      ),
    );
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (checkoutLock.current) return;

    const currentUser = getStoredAccount();
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      alert("Vui lòng đăng nhập bằng tài khoản khách hàng để thanh toán!");
      navigate("/login");
      return;
    }

    const normalizedAddress = normalizeAddress(address);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedAddress.length < 10 || normalizedAddress.length > 200) {
      alert("Địa chỉ giao hàng phải có từ 10 đến 200 ký tự!");
      return;
    }

    if (!isVietnamesePhone(normalizedPhone)) {
      alert("Số điện thoại Việt Nam không hợp lệ!");
      return;
    }

    if (!cart.length) {
      alert("Giỏ hàng không có sản phẩm hợp lệ!");
      return;
    }

    checkoutLock.current = true;
    setSubmitting(true);
    const adjustedProducts = [];
    let orderCreated = false;

    try {
      const products = await getCollection("products");
      const productMap = new Map(
        products.map((product) => [Number(product.id), product]),
      );

      const preparedItems = cart.map((cartItem) => {
        const product = productMap.get(Number(cartItem.id));
        const quantity = Number(cartItem.quantity);

        if (!product || product.status === "INACTIVE") {
          throw new Error(`${cartItem.name} đã ngừng bán hoặc không còn tồn tại.`);
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Số lượng của ${product.name} không hợp lệ.`);
        }
        if (quantity > Number(product.stock)) {
          throw new Error(`${product.name} chỉ còn ${product.stock} sản phẩm.`);
        }

        const unitPrice = Number(product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(`Giá của ${product.name} không hợp lệ.`);
        }

        return {
          product,
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
        };
      });

      const verifiedTotal = preparedItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );

      for (const item of preparedItems) {
        const originalStock = Number(item.product.stock);
        await updateItem("products", item.productId, {
          stock: originalStock - item.quantity,
        });
        adjustedProducts.push({ id: item.productId, stock: originalStock });
      }

      const now = new Date().toISOString();
      await createItem("orders", {
        userId: currentUser.id,
        customerName: currentUser.fullName,
        address: normalizedAddress,
        phone: normalizedPhone,
        totalPrice: verifiedTotal,
        status: "Đang xử lý",
        paymentMethod,
        paymentStatus:
          paymentMethod === "COD" ? "Chưa thanh toán" : "Chờ thanh toán",
        stockRestored: false,
        date: now,
        updatedAt: now,
        statusHistory: [
          {
            status: "Đang xử lý",
            changedAt: now,
            changedBy: currentUser.id,
          },
        ],
        items: preparedItems.map(
          ({ productId, productName, unitPrice, quantity, lineTotal }) => ({
            productId,
            productName,
            unitPrice,
            quantity,
            lineTotal,
          }),
        ),
      });
      orderCreated = true;

      if (isBuyNow) clearBuyNowCart();
      else clearCart();

      alert("Đặt hàng thành công!");
      navigate("/order-history");
    } catch (err) {
      console.error(err);
      if (!orderCreated && adjustedProducts.length) {
        await rollbackStocks(adjustedProducts);
      }
      alert(err.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      checkoutLock.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "50px", textAlign: "center" }}>Đang tải...</div>;
  }

  if (!cart.length) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        {error || "Giỏ hàng trống, không thể thanh toán!"}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "60vh",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Thông tin người nhận hàng</h2>
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}

      <div
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <form
          onSubmit={handleCheckout}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              value={user?.fullName || ""}
              readOnly
              className="search-input"
              style={{ width: "100%", backgroundColor: "#f0f0f0" }}
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ giao hàng (*)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              minLength="10"
              maxLength="200"
              className="search-input"
              style={{ width: "100%" }}
              placeholder="Ví dụ: 123 Đường ABC, Quận XYZ..."
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại liên hệ (*)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength="12"
              inputMode="numeric"
              className="search-input"
              style={{ width: "100%" }}
              placeholder="Ví dụ: 0912345678"
            />
          </div>

          <div className="form-group">
            <label>Phương thức thanh toán</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="search-input"
              style={{ width: "100%" }}
            >
              <option value="COD">Thanh toán khi nhận hàng (COD)</option>
              <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
            </select>
          </div>

          <div style={{ marginTop: "10px" }}>
            <h3 style={{ marginBottom: "12px" }}>Sản phẩm đặt mua</h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px", fontWeight: "600" }}>
                      {item.name}
                    </td>
                    <td>{Number(item.price).toLocaleString("vi-VN")}đ</td>
                    <td>{item.quantity}</td>
                    <td style={{ color: "#ed1c24", fontWeight: "bold" }}>
                      {(Number(item.price) * Number(item.quantity)).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              borderTop: "2px solid #eee",
              marginTop: "10px",
              paddingTop: "20px",
              textAlign: "right",
            }}
          >
            <h3 style={{ fontSize: "24px", marginBottom: "15px" }}>
              Tổng thanh toán:{" "}
              <span style={{ color: "#e53e3e" }}>
                {total.toLocaleString("vi-VN")}đ
              </span>
            </h3>
            <button
              type="submit"
              className="btn-submit"
              style={{ width: "250px" }}
              disabled={submitting || Boolean(error)}
            >
              {submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
