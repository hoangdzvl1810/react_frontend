import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getCollection } from "../services/api";
import { getProductImage } from "../utils/productImages";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 16;

const SORT_OPTIONS = {
  default: "Mặc định",
  priceAsc: "Giá thấp đến cao",
  priceDesc: "Giá cao đến thấp",
  nameAsc: "Tên A - Z",
  nameDesc: "Tên Z - A",
};

export default function Brands() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const brandId = searchParams.get("id") || searchParams.get("brand") || "";
  const categoryId = searchParams.get("category") || searchParams.get("categoryId") || "";
  const priceRange = searchParams.get("price") || "";
  const keyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "default";

  // Reset page whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [brandId, categoryId, priceRange, keyword, sort]);

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
          (category) => category.status !== "INACTIVE"
        );
        const activeBrands = (brandsData || []).filter(
          (brand) => brand.status !== "INACTIVE"
        );

        const activeCategoryIds = activeCategories.map((c) => String(c.id));
        const activeBrandIds = activeBrands.map((b) => String(b.id));

        const activeProducts = (productsData || []).filter(
          (product) =>
            product.status !== "INACTIVE" &&
            activeCategoryIds.includes(String(product.categoryId)) &&
            (activeBrandIds.length === 0 || activeBrandIds.includes(String(product.brandId)))
        );

        setCategories(activeCategories);
        setBrands(activeBrands);
        setProducts(activeProducts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedBrand = useMemo(
    () => brands.find((item) => String(item.id) === String(brandId)),
    [brands, brandId]
  );

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(categoryId)),
    [categories, categoryId]
  );

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchBrand =
        !brandId || String(product.brandId) === String(brandId);

      const matchCategory =
        !categoryId || String(product.categoryId) === String(categoryId);

      const matchPrice =
        !priceRange ||
        (priceRange === "0-5" && product.price >= 0 && product.price <= 5000000) ||
        (priceRange === "5-10" && product.price > 5000000 && product.price <= 10000000) ||
        (priceRange === "10+" && product.price > 10000000);

      const matchKeyword =
        !normalizedKeyword ||
        product.name?.toLowerCase().includes(normalizedKeyword) ||
        product.description?.toLowerCase().includes(normalizedKeyword);

      return matchBrand && matchCategory && matchPrice && matchKeyword;
    });

    return result.sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "nameAsc") return a.name.localeCompare(b.name);
      if (sort === "nameDesc") return b.name.localeCompare(a.name);
      return a.id - b.id;
    });
  }, [products, brandId, categoryId, priceRange, keyword, sort]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Clean redundant keys if any
    if (key === "brand") nextParams.delete("id");
    if (key === "id") nextParams.delete("brand");
    setSearchParams(nextParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParam("keyword", formData.get("keyword")?.trim());
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const handleAddToCart = (product) => {
    if (!account) {
      toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    if (product.status === "INACTIVE" || Number(product.stock) <= 0) {
      toast.error("Sản phẩm đã hết hàng hoặc ngừng bán.");
      return;
    }

    const result = addToCartContext(product.id, 1, product.stock);
    if (!result.ok) {
      toast.warning("Số lượng trong giỏ đã đạt mức tồn kho tối đa.");
      return;
    }

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const heading = keyword
    ? `Tìm kiếm trong thương hiệu: "${keyword}"`
    : selectedBrand && selectedCategory
    ? `${selectedBrand.name} - ${selectedCategory.name}`
    : selectedBrand
    ? `Thương hiệu ${selectedBrand.name}`
    : selectedCategory
    ? `Linh kiện ${selectedCategory.name}`
    : "Tất cả thương hiệu chính hãng";

  return (
    <main className="brand-page">
      <nav className="brand-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/brands">Thương hiệu</Link>
        {selectedBrand && (
          <>
            <span>/</span>
            <strong>{selectedBrand.name}</strong>
          </>
        )}
        {selectedCategory && (
          <>
            <span>/</span>
            <strong>{selectedCategory.name}</strong>
          </>
        )}
      </nav>

      <header className="brand-heading">
        <div>
          <h1>{heading}</h1>
          <p>
            Khám phá linh kiện máy tính chính hãng từ các thương hiệu hàng đầu thế giới
          </p>
        </div>
      </header>

      <div className="brand-layout">
        {/* Sidebar Bộ lọc */}
        <aside className="brand-sidebar">
          {/* Bộ lọc Thương hiệu */}
          <div className="filter-panel">
            <div className="filter-title">
              <h2>Thương hiệu</h2>
            </div>

            <label className={!brandId ? "is-checked" : ""}>
              <input
                type="radio"
                name="brand-filter"
                checked={!brandId}
                onChange={() => updateParam("brand", "")}
              />
              Tất cả thương hiệu
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
                ({products.length})
              </span>
            </label>

            {brands.map((brand) => {
              const count = products.filter(
                (p) => String(p.brandId) === String(brand.id)
              ).length;
              return (
                <label
                  className={brandId === String(brand.id) ? "is-checked" : ""}
                  key={brand.id}
                >
                  <input
                    type="radio"
                    name="brand-filter"
                    checked={brandId === String(brand.id)}
                    onChange={() => updateParam("brand", String(brand.id))}
                  />
                  {brand.name}
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>

          {/* Bộ lọc Danh mục linh kiện */}
          <div className="filter-panel">
            <div className="filter-title">
              <h2>Danh mục linh kiện</h2>
            </div>

            <label className={!categoryId ? "is-checked" : ""}>
              <input
                type="radio"
                name="category-filter"
                checked={!categoryId}
                onChange={() => updateParam("category", "")}
              />
              Tất cả linh kiện
            </label>

            {categories.map((category) => {
              const count = products.filter(
                (p) =>
                  (!brandId || String(p.brandId) === String(brandId)) &&
                  String(p.categoryId) === String(category.id)
              ).length;

              return (
                <label
                  className={categoryId === String(category.id) ? "is-checked" : ""}
                  key={category.id}
                >
                  <input
                    type="radio"
                    name="category-filter"
                    checked={categoryId === String(category.id)}
                    onChange={() => updateParam("category", String(category.id))}
                  />
                  {category.name}
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>

          {/* Bộ lọc Khoảng giá */}
          <div className="filter-panel">
            <div className="filter-title">
              <h2>Khoảng giá</h2>
            </div>

            <label className={!priceRange ? "is-checked" : ""}>
              <input
                type="radio"
                name="brand-price"
                checked={!priceRange}
                onChange={() => updateParam("price", "")}
              />
              Tất cả mức giá
            </label>

            <label className={priceRange === "0-5" ? "is-checked" : ""}>
              <input
                type="radio"
                name="brand-price"
                checked={priceRange === "0-5"}
                onChange={() => updateParam("price", "0-5")}
              />
              Dưới 5 triệu
            </label>

            <label className={priceRange === "5-10" ? "is-checked" : ""}>
              <input
                type="radio"
                name="brand-price"
                checked={priceRange === "5-10"}
                onChange={() => updateParam("price", "5-10")}
              />
              5 - 10 triệu
            </label>

            <label className={priceRange === "10+" ? "is-checked" : ""}>
              <input
                type="radio"
                name="brand-price"
                checked={priceRange === "10+"}
                onChange={() => updateParam("price", "10+")}
              />
              Trên 10 triệu
            </label>

            {(brandId || categoryId || priceRange || keyword) && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearFilters}
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#fee2e2",
                  color: "#ef4444",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "600",
                }}
              >
                ✕ Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </aside>

        {/* Nội dung danh sách sản phẩm */}
        <section className="brand-content">
          <div className="brand-result-head">
            <div>
              <h2>
                Danh sách sản phẩm <span>({filteredProducts.length})</span>
              </h2>
              <p>
                {loading
                  ? "Đang tải dữ liệu..."
                  : "Tìm thấy " + filteredProducts.length + " sản phẩm"}
              </p>
            </div>

            <form
              className="brand-product-search-form"
              onSubmit={handleSearch}
            >
              <input
                key={keyword}
                type="text"
                name="keyword"
                defaultValue={keyword}
                placeholder="Tìm tên hoặc mô tả linh kiện..."
              />
              <button type="submit">Tìm</button>
            </form>

            <label>
              Sắp xếp:
              <select
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
              >
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="brand-product-grid">
            {loading ? (
              <div className="brand-empty">
                <h3>Đang tải sản phẩm...</h3>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <article className="brand-product-card" key={product.id}>
                  <Link
                    className="brand-product-image"
                    to={`/product-detail/${product.id}`}
                  >
                    <img
                      src={getProductImage(product.image)}
                      alt={product.name}
                      onError={(e) =>
                        (e.target.src = "https://via.placeholder.com/200")
                      }
                    />
                  </Link>

                  <h3>
                    <Link to={`/product-detail/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>

                  <strong>{Number(product.price).toLocaleString("vi-VN")}đ</strong>

                  <p className="stock">
                    {Number(product.stock) > 0
                      ? `Còn hàng (${product.stock} sp)`
                      : "Hết hàng"}
                  </p>

                  <div className="product-actions">
                    <Link
                      className="detail-btn"
                      to={`/product-detail/${product.id}`}
                    >
                      Chi tiết
                    </Link>

                    <button
                      className="cart-btn"
                      type="button"
                      disabled={Number(product.stock) <= 0}
                      onClick={() => handleAddToCart(product)}
                      title="Thêm vào giỏ hàng"
                    >
                      <i className="fa-solid fa-cart-shopping"></i>
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="brand-empty">
                <h3>Không tìm thấy sản phẩm phù hợp</h3>
                <p>Thử chọn thương hiệu khác hoặc xóa bớt tiêu chí lọc.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    background: "#ed1c24",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}
          </section>

          {!loading && filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 180, behavior: "smooth" });
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
