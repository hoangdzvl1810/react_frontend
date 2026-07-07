import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createItem, getCollection, getItem } from "../services/api";
import { getProductImage } from "../utils/productImages";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);

        const productData = await getItem("products", id);
        if (!productData) {
          setProduct(null);
          return;
        }
        const brandsData = await getCollection("brands");
        const categoriesData = await getCollection("categories");
        const productsData = await getCollection("products");
        const ordersData = await getCollection("orders");
        const reviewsData = await getCollection("reviews");

        setProduct(productData);

        const currentBrand =
          brandsData.find((item) => item.id === productData?.brandId) || null;

        const currentCategory =
          categoriesData.find((item) => item.id === productData?.categoryId) ||
          null;

        setBrand(currentBrand);
        setCategory(currentCategory);

        setSimilarProducts(
          productsData
            .filter(
              (item) =>
                item.categoryId === productData?.categoryId &&
                item.id !== productData?.id &&
                item.status !== "INACTIVE",
            )
            .slice(0, 4),
        );

        const productReviews = reviewsData.filter(
          (review) => Number(review.productId) === Number(productData.id),
        );

        setReviews(productReviews);

        const currentUser = JSON.parse(localStorage.getItem("account"));

        if (currentUser) {
          const deliveredOrder = ordersData.find(
            (order) =>
              Number(order.userId) === Number(currentUser.id) &&
              order.status === "Đã giao hàng" &&
              order.items?.some(
                (item) => Number(item.id) === Number(productData.id),
              ),
          );

          const alreadyReviewed = reviewsData.some(
            (review) =>
              Number(review.userId) === Number(currentUser.id) &&
              Number(review.productId) === Number(productData.id),
          );

          setCanReview(Boolean(deliveredOrder) && !alreadyReviewed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const addToCart = (goToCheckout = false) => {
    if (quantity > product.stock) {
      alert("Số lượng mua không được lớn hơn tồn kho!");
      return;
    }

    if (goToCheckout) {
      localStorage.setItem(
        "buyNowCart",
        JSON.stringify([{ ...product, quantity }]),
      );

      navigate("/checkout?type=buy-now");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const exist = cart.find((item) => item.id === product.id);

    if (exist) {
      if (exist.quantity + quantity > product.stock) {
        alert(
          "Không thể thêm sản phẩm! Số lượng trong giỏ đã vượt quá tồn kho.",
        );
        return;
      }

      exist.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    alert("Đã thêm sản phẩm vào giỏ hàng!");
  };

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);

    if (value < 1) {
      setQuantity(1);
      return;
    }

    if (value > product.stock) {
      setQuantity(product.stock);
      return;
    }

    setQuantity(value);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("account"));

    if (!currentUser) {
      alert("Vui lòng đăng nhập để đánh giá sản phẩm!");
      return;
    }

    if (!canReview) {
      alert(
        "Bạn chỉ có thể đánh giá sản phẩm đã giao thành công và chưa đánh giá.",
      );
      return;
    }

    if (comment.trim() === "") {
      alert("Vui lòng nhập bình luận!");
      return;
    }

    const newReview = await createItem("reviews", {
      productId: product.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date().toISOString(),
    });

    setReviews([...reviews, newReview]);
    setCanReview(false);
    setRating(5);
    setComment("");

    alert("Gửi đánh giá thành công!");
  };

  if (loading) {
    return (
      <main className="product-detail-page">
        <div className="empty-similar">Đang tải dữ liệu...</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="empty-similar">
          <i className="fa-regular fa-circle-xmark"></i>
          Không tìm thấy sản phẩm.
        </div>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <nav className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/categories">Sản phẩm</Link>

        {category && (
          <>
            <span>/</span>
            <Link to={`/categories?id=${category.id}`}>{category.name}</Link>
          </>
        )}

        <span>/</span>
        <strong>{product.name}</strong>
      </nav>

      <section className="detail-card">
        <div className="product-images">
          <div className="main-image">
            <img
              src={getProductImage(product.image)}
              alt={product.name}
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/400")
              }
            />
          </div>
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>

          <div className="product-meta-details">
            <span className="meta-item">
              <span className="meta-label">Mã SP:</span>
              <span className="meta-value">#{product.id}</span>
            </span>

            <span className="meta-divider">|</span>

            <span className="meta-item">
              <span className="meta-label">Thương hiệu:</span>
              <span className="meta-value">
                {brand?.name || "Đang cập nhật"}
              </span>
            </span>

            <span className="meta-divider">|</span>

            <span className="meta-item">
              <span className="meta-label">Danh mục:</span>
              <span className="meta-value">
                {category?.name || "Đang cập nhật"}
              </span>
            </span>
          </div>

          <div className="rating-row">
            {reviews.length > 0 ? (
              <div className="rating-row">
                <span className="rating-badge">
                  {(
                    reviews.reduce(
                      (sum, review) => sum + Number(review.rating),
                      0,
                    ) / reviews.length
                  ).toFixed(1)}
                </span>

                <span className="stars">
                  {"★".repeat(
                    Math.round(
                      reviews.reduce(
                        (sum, review) => sum + Number(review.rating),
                        0,
                      ) / reviews.length,
                    ),
                  )}
                </span>

                <span className="review-count">{reviews.length} đánh giá</span>
              </div>
            ) : (
              <div className="rating-row">
                <span className="review-count">Chưa có đánh giá</span>
              </div>
            )}
          </div>

          <div className="price">{product.price.toLocaleString("vi-VN")}đ</div>

          <div className="stock-status">
            <span
              className={`badge-stock ${
                product.stock > 0 ? "in-stock" : "out-stock"
              }`}
            >
              {product.stock > 0 ? "Còn hàng" : "Tạm hết hàng"}
            </span>

            <span className="quantity-text">
              {product.stock > 0
                ? `${product.stock} sản phẩm có sẵn`
                : "Vui lòng quay lại sau"}
            </span>
          </div>

          <div className="purchase-panel">
            <div className="warranty-box">
              <div className="warranty-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>

              <div>
                <span>Bảo hành chính hãng</span>
                <strong>Hỗ trợ đổi trả theo chính sách ProBuild PC</strong>
              </div>
            </div>

            <div className="purchase-form">
              <label className="quantity-box">
                <span>Số lượng</span>

                <input
                  className="quantity-input"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={product.stock <= 0}
                />
              </label>

              <div className="action-buttons">
                <button
                  type="button"
                  className="add-cart-btn"
                  onClick={() => addToCart(false)}
                  disabled={product.stock <= 0}
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  Thêm giỏ
                </button>

                <button
                  type="button"
                  className="buy-btn"
                  onClick={() => addToCart(true)}
                  disabled={product.stock <= 0}
                >
                  <i className="fa-solid fa-bolt"></i>
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="description-card">
        <div className="description-box">
          <div className="description-title-row">
            <div>
              <h2>Mô tả sản phẩm</h2>
              <span>Thông tin tổng quan và điểm nổi bật</span>
            </div>

            <i className="fa-solid fa-circle-info"></i>
          </div>

          <div className="description-content">
            <p>
              {product.description ||
                "Sản phẩm đang được cập nhật mô tả chi tiết."}
            </p>
          </div>
        </div>
      </section>

      <section className="description-card">
        <div className="description-box">
          <div className="description-title-row">
            <div>
              <h2>Đánh giá sản phẩm</h2>
              <span>Nhận xét từ khách hàng đã mua sản phẩm</span>
            </div>

            <i className="fa-solid fa-star"></i>
          </div>

          {canReview && (
            <form
              onSubmit={handleSubmitReview}
              style={{ marginBottom: "24px" }}
            >
              <label style={{ fontWeight: "bold" }}>Chọn số sao</label>

              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{
                  display: "block",
                  marginTop: "8px",
                  marginBottom: "12px",
                  width: "160px",
                  height: "40px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  padding: "0 10px",
                }}
              >
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập bình luận của bạn..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  resize: "vertical",
                }}
              />

              <button
                type="submit"
                style={{
                  marginTop: "12px",
                  padding: "10px 20px",
                  background: "#ed1c24",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Gửi đánh giá
              </button>
            </form>
          )}

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>{review.userName}</strong>

                <div style={{ color: "#f59e0b", margin: "4px 0" }}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>

                <p>{review.comment}</p>

                <small>{new Date(review.date).toLocaleString("vi-VN")}</small>
              </div>
            ))
          ) : (
            <p>Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </div>
      </section>

      <section className="similar-card">
        <div className="similar-header">
          <h2>Sản phẩm cùng danh mục</h2>
          <p>
            {category
              ? `Các lựa chọn khác trong ${category.name}`
              : "Các lựa chọn liên quan"}
          </p>
        </div>

        {similarProducts.length > 0 ? (
          <div className="similar-products-row">
            {similarProducts.map((item) => (
              <Link
                className="similar-product-item"
                to={`/product-detail/${item.id}`}
                key={item.id}
              >
                <div className="similar-product-img">
                  <img
                    src={getProductImage(item.image)}
                    alt={item.name}
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/180")
                    }
                  />
                </div>

                <h3>{item.name}</h3>

                <span className="similar-price">
                  {item.price.toLocaleString("vi-VN")}đ
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-similar">
            <i className="fa-regular fa-folder-open"></i>
            Chưa có sản phẩm liên quan.
          </div>
        )}
      </section>
    </main>
  );
}
