import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createItem, getCollection, updateItem } from "../services/api";
import {
  clearBuyNowCart,
  readBuyNowCart,
  readCart,
} from "../utils/cartStorage";
import { getProductImage } from "../utils/productImages";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const normalizeAddress = (value) => value.trim().replace(/\s+/g, " ");
const normalizePhone = (value) => value.replace(/\s+/g, "");
const isVietnamesePhone = (value) => /^0(3|5|7|8|9)\d{8}$/.test(value);

export default function Checkout() {
  const { account } = useAuth();
  const { clearCart } = useCart();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(account);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkoutLock = useRef(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get("type") === "buy-now";
  const toast = useToast();

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
          setUser(account);
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
  }, [isBuyNow, account]);

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cart]);

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

    const currentUser = account;
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      toast.warning("Vui lòng đăng nhập bằng tài khoản khách hàng để thanh toán!");
      navigate("/login");
      return;
    }

    const normalizedAddress = normalizeAddress(address);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedAddress.length < 10 || normalizedAddress.length > 200) {
      toast.error("Địa chỉ giao hàng phải có từ 10 đến 200 ký tự!");
      return;
    }

    if (!isVietnamesePhone(normalizedPhone)) {
      toast.error("Số điện thoại Việt Nam không hợp lệ (VD: 0912345678)!");
      return;
    }

    if (!cart.length) {
      toast.error("Giỏ hàng không có sản phẩm hợp lệ!");
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
          image: product.image,
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
        note: note.trim(),
        totalPrice: verifiedTotal,
        status: "Đang xử lý",
        paymentMethod,
        paymentStatus:
          paymentMethod === "COD" ? "Chưa thanh toán" : "Chờ xác nhận",
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
          ({ productId, productName, image, unitPrice, quantity, lineTotal }) => ({
            productId,
            productName,
            image,
            unitPrice,
            quantity,
            lineTotal,
          }),
        ),
      });
      orderCreated = true;

      if (isBuyNow) clearBuyNowCart();
      else clearCart();

      toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại ProBuild PC.");
      navigate("/order-history");
    } catch (err) {
      console.error(err);
      if (!orderCreated && adjustedProducts.length) {
        await rollbackStocks(adjustedProducts);
      }
      toast.error(err.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      checkoutLock.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page-wrap">
        <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "32px", marginBottom: "12px" }}></i>
          <p>Đang chuẩn bị trang thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="checkout-page-wrap">
        <div className="cart-empty-panel">
          <i className="fa-solid fa-cart-shopping cart-empty-icon"></i>
          <h2>Không có sản phẩm nào để thanh toán!</h2>
          <p>{error || "Vui lòng chọn sản phẩm vào giỏ hàng trước khi đặt hàng."}</p>
          <Link
            to="/categories"
            className="cart-checkout-btn"
            style={{ display: "inline-block", width: "auto", padding: "12px 28px" }}
          >
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="checkout-page-wrap">
      <div className="checkout-header-title">
        <h1>Thanh Toán Đơn Hàng</h1>
        <p>Vui lòng điền thông tin nhận hàng và chọn phương thức thanh toán.</p>
      </div>

      <form onSubmit={handleCheckout}>
        <div className="checkout-layout-grid">
          {/* Left Column: Form Details */}
          <div className="checkout-form-panel">
            <h3 className="checkout-section-title">
              <i className="fa-solid fa-location-dot"></i> Thông tin giao hàng
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label className="modal-field-label">Người nhận hàng</label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  readOnly
                  className="modal-input"
                  style={{ background: "#f8fafc", color: "#64748b" }}
                />
              </div>

              <div>
                <label className="modal-field-label">Số điện thoại (*)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength="12"
                  placeholder="VD: 0912345678"
                  className="modal-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="modal-field-label">Địa chỉ nhận hàng (*)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                minLength="10"
                maxLength="200"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                className="modal-input"
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label className="modal-field-label">Ghi chú giao hàng (Tùy chọn)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
                style={{
                  width: "100%",
                  minHeight: "70px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>

            <h3 className="checkout-section-title">
              <i className="fa-solid fa-wallet"></i> Phương thức thanh toán
            </h3>

            <div className="payment-method-selector">
              <div
                className={`payment-option-card ${paymentMethod === "COD" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("COD")}
              >
                <strong>
                  <i className="fa-solid fa-hand-holding-dollar"></i> Thanh toán COD
                </strong>
                <small>Thanh toán bằng tiền mặt khi shipper giao hàng</small>
              </div>

              <div
                className={`payment-option-card ${paymentMethod === "BANK_TRANSFER" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
              >
                <strong>
                  <i className="fa-solid fa-building-columns"></i> Chuyển khoản QR
                </strong>
                <small>Chuyển khoản ngân hàng 24/7 qua mã VietQR</small>
              </div>
            </div>

            {paymentMethod === "BANK_TRANSFER" && (
              <div className="bank-info-box">
                <p>
                  <strong>Ngân hàng:</strong> MB Bank (Quân Đội)
                </p>
                <p>
                  <strong>Số tài khoản:</strong> <code>0988889999</code>
                </p>
                <p>
                  <strong>Chủ tài khoản:</strong> CÔNG TY PROBUILD PC VIỆT NAM
                </p>
                <p>
                  <strong>Nội dung CK:</strong> <code>PROBUILD {phone || user?.id || "ORDER"}</code>
                </p>
                <small style={{ color: "#64748b", display: "block", marginTop: "6px" }}>
                  * Đơn hàng sẽ được nhân viên xác nhận ngay sau khi nhận được chuyển khoản.
                </small>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <aside className="checkout-summary-card">
            <h3 className="summary-title">Đơn hàng của bạn ({cart.length} món)</h3>

            <div style={{ maxHeight: "240px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <img
                    src={getProductImage(item.image)}
                    alt={item.name}
                    style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "contain" }}
                  />
                  <div style={{ flex: 1, fontSize: "13px" }}>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.name}</div>
                    <div style={{ color: "#64748b" }}>
                      Số lượng: <strong>x{item.quantity}</strong>
                    </div>
                  </div>
                  <div style={{ fontWeight: "700", color: "#dc2626", fontSize: "13px" }}>
                    {(Number(item.price) * Number(item.quantity)).toLocaleString("vi-VN")}đ
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-line">
              <span>Tạm tính</span>
              <strong>{total.toLocaleString("vi-VN")}đ</strong>
            </div>

            <div className="summary-line">
              <span>Phí vận chuyển</span>
              <span style={{ color: "#16a34a", fontWeight: "700" }}>Miễn phí</span>
            </div>

            <div className="summary-line total-line">
              <span>Tổng thanh toán</span>
              <span className="grand-price">{total.toLocaleString("vi-VN")}đ</span>
            </div>

            <button
              type="submit"
              className="cart-checkout-btn"
              disabled={submitting}
            >
              {submitting ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...
                </span>
              ) : (
                <span>
                  <i className="fa-solid fa-check"></i> Xác nhận đặt hàng
                </span>
              )}
            </button>

            <div className="trust-badges">
              <div className="trust-item">
                <i className="fa-solid fa-lock"></i> Bảo mật thanh toán SSL 256-bit
              </div>
              <div className="trust-item">
                <i className="fa-solid fa-box"></i> Đóng gói chống sốc chuyên dụng
              </div>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
