import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCollection } from "../services/api";
import { getProductImage } from "../utils/productImages";

const SORT_OPTIONS = {
  default: "Mặc định",
  priceAsc: "Giá thấp đến cao",
  priceDesc: "Giá cao đến thấp",
  nameAsc: "Tên A-Z",
  nameDesc: "Tên Z-A",
};

export default function Categories() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get("id") || "";
  const priceRange = searchParams.get("price") || "";
  const keyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "default";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const categoriesData = await getCollection("categories");
        const productsData = await getCollection("products");

        const activeCategories = categoriesData.filter(
          (category) => category.status !== "INACTIVE",
        );

        const activeCategoryIds = activeCategories.map(
          (category) => category.id,
        );

        const activeProducts = productsData.filter(
          (product) =>
            product.status !== "INACTIVE" &&
            activeCategoryIds.includes(product.categoryId),
        );

        setCategories(activeCategories);
        setProducts(activeProducts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProductCountByCategory = (categoryIdValue) => {
    return products.filter((product) => product.categoryId === categoryIdValue)
      .length;
  };

  const selectedCategory = categories.find(
    (item) => String(item.id) === categoryId,
  );

  const getFilteredProducts = () => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchCategory =
        !categoryId || String(product.categoryId) === categoryId;

      const matchPrice =
        !priceRange ||
        (priceRange === "0-5" &&
          product.price >= 0 &&
          product.price <= 5000000) ||
        (priceRange === "5-10" &&
          product.price > 5000000 &&
          product.price <= 10000000) ||
        (priceRange === "10+" && product.price > 10000000);

      const matchKeyword =
        !normalizedKeyword ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.description?.toLowerCase().includes(normalizedKeyword);

      return matchCategory && matchPrice && matchKeyword;
    });

    result = [...result].sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "nameAsc") return a.name.localeCompare(b.name);
      if (sort === "nameDesc") return b.name.localeCompare(a.name);
      return a.id - b.id;
    });

    return result;
  };

  const filteredProducts = getFilteredProducts();

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    setSearchParams(nextParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParam("keyword", formData.get("keyword").trim());
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const addToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const exist = cart.find((item) => item.id === product.id);

    if (exist) {
      if (exist.quantity + 1 > product.stock) {
        alert(
          "Không thể thêm sản phẩm! Số lượng trong giỏ đã bằng số lượng tồn kho.",
        );
        return;
      }

      exist.quantity += 1;
    } else {
      if (product.stock <= 0) {
        alert("Sản phẩm đã hết hàng.");
        return;
      }

      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    alert("Đã thêm sản phẩm vào giỏ hàng!");
  };

  const heading = keyword
    ? `Kết quả cho "${keyword}"`
    : selectedCategory?.name || "Tất cả sản phẩm";

  return (
    <main className="category-page">
      <nav className="category-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <strong>Sản phẩm</strong>
      </nav>

      <header className="category-heading">
        <div>
          <h1>{heading}</h1>
          <p>
            {priceRange ? `Khoảng giá ${priceRange} · ` : ""}
            {filteredProducts.length} sản phẩm phù hợp
          </p>
        </div>
      </header>

      <div className="category-layout">
        <aside className="category-sidebar">
          <div className="filter-panel">
            <div className="filter-title">
              <h2>Danh mục</h2>
              <span>+</span>
            </div>

            <label className={!categoryId ? "is-checked" : ""}>
              <input
                type="radio"
                name="category"
                checked={!categoryId}
                onChange={() => updateParam("id", "")}
              />
              Tất cả
              <span className="category-count">({products.length})</span>
            </label>

            {categories.map((category) => (
              <label
                className={
                  categoryId === String(category.id) ? "is-checked" : ""
                }
                key={category.id}
              >
                <input
                  type="radio"
                  name="category"
                  checked={categoryId === String(category.id)}
                  onChange={() => updateParam("id", String(category.id))}
                />
                {category.name}
                <span className="category-count">
                  ({getProductCountByCategory(category.id)})
                </span>
              </label>
            ))}
          </div>

          <div className="filter-panel">
            <div className="filter-title">
              <h2>Khoảng giá</h2>
              <span>+</span>
            </div>

            <label className={!priceRange ? "is-checked" : ""}>
              <input
                type="radio"
                name="price"
                checked={!priceRange}
                onChange={() => updateParam("price", "")}
              />
              Tất cả
            </label>

            <label className={priceRange === "0-5" ? "is-checked" : ""}>
              <input
                type="radio"
                name="price"
                checked={priceRange === "0-5"}
                onChange={() => updateParam("price", "0-5")}
              />
              Từ 0 - 5 triệu
            </label>

            <label className={priceRange === "5-10" ? "is-checked" : ""}>
              <input
                type="radio"
                name="price"
                checked={priceRange === "5-10"}
                onChange={() => updateParam("price", "5-10")}
              />
              Từ 5 - 10 triệu
            </label>

            <label className={priceRange === "10+" ? "is-checked" : ""}>
              <input
                type="radio"
                name="price"
                checked={priceRange === "10+"}
                onChange={() => updateParam("price", "10+")}
              />
              Trên 10 triệu
            </label>

            <button type="button" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </aside>

        <section className="category-content">
          <div className="category-result-head">
            <div>
              <h2>
                Danh sách sản phẩm <span>({filteredProducts.length})</span>
              </h2>
              <p>
                {loading
                  ? "Đang tải dữ liệu..."
                  : "Chọn bộ lọc để tìm linh kiện phù hợp."}
              </p>
            </div>

            <form
              className="category-product-search-form"
              onSubmit={handleSearch}
            >
              <input
                key={keyword}
                type="text"
                name="keyword"
                defaultValue={keyword}
                placeholder="Tìm trong sản phẩm..."
              />
              <button type="submit">Tìm kiếm</button>
            </form>

            <label>
              Sắp xếp
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

          <section className="category-product-grid">
            {loading ? (
              <div className="category-empty">
                <h3>Đang tải sản phẩm</h3>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article className="category-product-card" key={product.id}>
                  <Link
                    className="category-product-image"
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

                  <strong>{product.price.toLocaleString("vi-VN")}đ</strong>

                  <p className="stock">
                    {product.stock > 0
                      ? `Còn hàng: ${product.stock}`
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
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      <i className="fa-solid fa-cart-shopping"></i>
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="category-empty">
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử đổi từ khóa hoặc xóa bớt bộ lọc.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
