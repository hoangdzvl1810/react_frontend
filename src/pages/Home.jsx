import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCollection } from "../services/api";
import { getProductImage } from "../utils/productImages";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 16;

export default function Home() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, brandsData, productsData] = await Promise.all([
          getCollection("categories"),
          getCollection("brands"),
          getCollection("products"),
        ]);

        const activeCategories = (categoriesData || []).filter(
          (category) => category.status !== "INACTIVE",
        );

        const activeBrands = (brandsData || []).filter(
          (brand) => brand.status !== "INACTIVE",
        );

        const activeCategoryIds = activeCategories.map(
          (category) => String(category.id),
        );
        const activeBrandIds = activeBrands.map((brand) => String(brand.id));

        const activeProducts = (productsData || []).filter(
          (product) =>
            product.status !== "INACTIVE" &&
            activeCategoryIds.includes(String(product.categoryId)) &&
            (activeBrandIds.length === 0 || activeBrandIds.includes(String(product.brandId))),
        );

        setCategories(activeCategories);
        setProducts(activeProducts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (product) => {
    if (!account) {
      toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    if (product.status === "INACTIVE" || Number(product.stock) <= 0) {
      toast.error("Sản phẩm đã hết hàng hoặc ngừng kinh doanh.");
      return;
    }

    const result = addToCartContext(product.id, 1, product.stock);
    if (!result.ok) {
      toast.warning("Số lượng trong giỏ hàng đã đạt mức tồn kho tối đa!");
      return;
    }

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, currentPage]);

  return (
    <main className="page-shell">
      <aside className="sidebar">
        <h2>DANH MỤC SẢN PHẨM</h2>
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={`/categories?id=${category.id}`}>{category.name}</Link>
            </li>
          ))}
        </ul>

        <Link className="all-categories" to="/categories">
          ▦ Xem tất cả sản phẩm
        </Link>
      </aside>

      <section className="content">
        <section className="hero-banner">
          <div className="hero-copy">
            <p>ProBUILD PC</p>
            <h1>
              ĐỈNH CAO HIỆU NĂNG
              <br />
              NÂNG TẦM TRẢI NGHIỆM
            </h1>
            <span>TRỐN NẮNG TRONG PHÒNG - BUILD PC ĐỈNH DÒNG</span>
          </div>
        </section>

        <section className="service-row">
          <article>
            <span>
              <i className="fa-solid fa-shield-halved"></i>
            </span>
            <div>
              <strong>Hàng chính hãng</strong>
              <small>100% linh kiện phân phối chính hãng</small>
            </div>
          </article>

          <article>
            <span>
              <i className="fa-solid fa-rotate"></i>
            </span>
            <div>
              <strong>Bảo hành uy tín</strong>
              <small>Bảo hành tận nơi lên đến 36 tháng</small>
            </div>
          </article>

          <article>
            <span>
              <i className="fa-solid fa-truck-fast"></i>
            </span>
            <div>
              <strong>Giao hàng toàn quốc</strong>
              <small>Miễn phí giao hàng từ 1 triệu</small>
            </div>
          </article>

          <article>
            <span>
              <i className="fa-solid fa-headset"></i>
            </span>
            <div>
              <strong>Hỗ trợ 24/7</strong>
              <small>Kỹ thuật viên tư vấn tận tâm</small>
            </div>
          </article>
        </section>

        <section className="product-grid">
          {loading ? (
            <p style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px", color: "#64748b" }}>
              Đang tải danh sách linh kiện...
            </p>
          ) : paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <figure>
                  <img
                    src={getProductImage(product.image)}
                    alt={product.name}
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/200")
                    }
                  />
                </figure>

                <h3>{product.name}</h3>
                <strong>{Number(product.price).toLocaleString("vi-VN")}đ</strong>

                <p
                  className={`product-stock ${
                    Number(product.stock) > 0 ? "in-stock" : "out-of-stock"
                  }`}
                >
                  {Number(product.stock) > 0
                    ? `Còn hàng: ${product.stock} sp`
                    : "Hết hàng"}
                </p>

                <div className="product-actions">
                  <Link
                    className="detail-btn"
                    to={`/product-detail/${product.id}`}
                  >
                    Xem chi tiết
                  </Link>

                  <button
                    className="cart-btn"
                    disabled={Number(product.stock) <= 0}
                    onClick={() => addToCart(product)}
                    type="button"
                    title="Thêm vào giỏ hàng"
                  >
                    <i className="fa-solid fa-cart-shopping"></i>
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="home-empty-message">
              Không có sản phẩm nào để hiển thị.
            </p>
          )}
        </section>

        {!loading && products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={products.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 400, behavior: "smooth" });
            }}
          />
        )}
      </section>
    </main>
  );
}
