import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getCollection } from "../services/api";
import { readCart, writeCart } from "../utils/cartStorage";
import { getProductImage } from "../utils/productImages";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "../components/Modal";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  // Voucher coupon state
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");

  const toast = useToast();

  useEffect(() => {
    let active = true;

    const loadCart = async () => {
      try {
        const storedCart = readCart();
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

        writeCart(hydratedCart);
        if (active) setCart(hydratedCart);
      } catch (err) {
        console.error(err);
        if (active) setError("Không thể tải giỏ hàng. Vui lòng thử lại.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCart();
    return () => {
      active = false;
    };
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    writeCart(newCart);
  };

  const updateQuantity = (id, delta) => {
    const newCart = cart.map((item) => {
      if (item.id === id) {
        const newQty = Number(item.quantity) + delta;

        if (newQty > Number(item.stock)) {
          toast.warning(`Sản phẩm "${item.name}" chỉ còn ${item.stock} cái trong kho!`);
          return item;
        }

        if (newQty < 1) {
          return item;
        }

        return {
          ...item,
          quantity: newQty,
        };
      }

      return item;
    });

    saveCart(newCart);
  };

  const handleRemoveConfirm = () => {
    const { item } = deleteModal;
    if (!item) return;
    setDeleteModal({ isOpen: false, item: null });

    const newCart = cart.filter((i) => i.id !== item.id);
    saveCart(newCart);
    toast.info(`Đã xóa "${item.name}" khỏi giỏ hàng.`);
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "PROBUILD10") {
      setDiscountPercent(10);
      setAppliedCode(code);
      toast.success("Áp dụng mã giảm 10% thành công!");
    } else if (code === "VIP20") {
      setDiscountPercent(20);
      setAppliedCode(code);
      toast.success("Áp dụng mã VIP giảm 20% thành công!");
    } else {
      toast.error("Mã ưu đãi không hợp lệ hoặc đã hết hạn!");
    }
  };

  const rawSubtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((rawSubtotal * discountPercent) / 100);
  }, [rawSubtotal, discountPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount);
  }, [rawSubtotal, discountAmount]);

  const canCheckout = useMemo(() => {
    return (
      cart.length > 0 &&
      cart.every(
        (item) =>
          Number.isInteger(Number(item.quantity)) &&
          Number(item.quantity) > 0 &&
          Number(item.quantity) <= Number(item.stock)
      )
    );
  }, [cart]);

  if (loading) {
    return (
      <div className="cart-page-wrap">
        <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "32px", marginBottom: "12px" }}></i>
          <p>Đang tải thông tin giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page-wrap">
        <div className="cart-empty-panel">
          <i className="fa-solid fa-circle-exclamation cart-empty-icon" style={{ color: "#ef4444" }}></i>
          <h2>Lỗi tải giỏ hàng</h2>
          <p>{error}</p>
          <Link to="/categories" className="cart-checkout-btn" style={{ maxWidth: "220px", margin: "0 auto" }}>
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="cart-page-wrap">
      <div className="cart-header-title">
        <h1>Giỏ Hàng Của Bạn</h1>
        <p>Kiểm tra danh sách linh kiện đã chọn trước khi tiến hành thanh toán.</p>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty-panel">
          <div className="cart-empty-icon">
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
          <h2>Giỏ hàng của bạn đang trống!</h2>
          <p>Hãy khám phá hàng ngàn linh kiện máy tính chính hãng với giá tốt nhất.</p>
          <Link
            to="/categories"
            className="cart-checkout-btn"
            style={{ display: "inline-block", width: "auto", padding: "12px 28px" }}
          >
            <i className="fa-solid fa-store"></i> Khám phá sản phẩm ngay
          </Link>
        </div>
      ) : (
        <div className="cart-layout-grid">
          {/* Left Column: Items */}
          <div className="cart-items-panel">
            {cart.map((item) => (
              <article key={item.id} className="cart-item-row">
                <img
                  src={getProductImage(item.image)}
                  alt={item.name}
                  className="cart-item-thumb"
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/72")
                  }
                />

                <div className="cart-item-info">
                  <Link
                    to={`/product-detail/${item.id}`}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>
                  <div className="cart-item-unit-price">
                    Đơn giá: <strong>{Number(item.price).toLocaleString("vi-VN")}đ</strong>
                  </div>
                </div>

                <div className="cart-qty-stepper">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                    title="Giảm số lượng"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stock}
                    title="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-total">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                </div>

                <button
                  type="button"
                  className="cart-btn-remove"
                  onClick={() => setDeleteModal({ isOpen: true, item })}
                  title="Xóa khỏi giỏ hàng"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </article>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <aside className="cart-summary-card">
            <h3 className="summary-title">Tóm tắt đơn hàng</h3>

            <div className="summary-line">
              <span>Tạm tính ({cart.length} món)</span>
              <strong>{rawSubtotal.toLocaleString("vi-VN")}đ</strong>
            </div>

            <div className="summary-line">
              <span>Phí vận chuyển</span>
              <span style={{ color: "#16a34a", fontWeight: "700" }}>Miễn phí</span>
            </div>

            {discountAmount > 0 && (
              <div className="summary-line" style={{ color: "#16a34a" }}>
                <span>Mã giảm giá ({appliedCode})</span>
                <strong>-{discountAmount.toLocaleString("vi-VN")}đ</strong>
              </div>
            )}

            {/* Voucher input form */}
            <form onSubmit={handleApplyCoupon} className="voucher-apply-box">
              <input
                type="text"
                placeholder="Mã giảm giá (PROBUILD10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="voucher-input"
              />
              <button type="submit" className="voucher-btn">
                Áp dụng
              </button>
            </form>

            <div className="summary-line total-line">
              <span>Tổng thanh toán</span>
              <span className="grand-price">
                {grandTotal.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {canCheckout ? (
              <Link to="/checkout" className="cart-checkout-btn">
                <i className="fa-solid fa-credit-card"></i> Tiến hành đặt hàng
              </Link>
            ) : (
              <button type="button" className="cart-checkout-btn" disabled>
                Vượt quá tồn kho
              </button>
            )}

            <div className="trust-badges">
              <div className="trust-item">
                <i className="fa-solid fa-shield-halved"></i> 100% Linh kiện chính hãng
              </div>
              <div className="trust-item">
                <i className="fa-solid fa-rotate-left"></i> Đổi trả miễn phí trong 15 ngày
              </div>
              <div className="trust-item">
                <i className="fa-solid fa-truck-fast"></i> Giao siêu tốc toàn quốc
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Confirm Delete Item Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa "${deleteModal.item?.name}" ra khỏi giỏ hàng?`}
        confirmText="Xóa sản phẩm"
        cancelText="Giữ lại"
        type="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, item: null })}
      />
    </main>
  );
}
