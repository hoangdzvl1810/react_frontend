import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCollection } from "../services/api";
import { getBrandImage } from "../utils/brandImages";
import { getProductImage } from "../utils/productImages";

const SORT_OPTIONS = {
  default: "Mặc định",
  priceAsc: "Giá thấp đến cao",
  priceDesc: "Giá cao đến thấp",
};

const logoFileName = (brandName) => `${brandName.toLowerCase()}.png`;

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const brandId = searchParams.get("id") || "";
  const priceRange = searchParams.get("price") || "";
  const keyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "default";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const brandsData = await getCollection("brands");
        const categoriesData = await getCollection("categories");
        const productsData = await getCollection("products");

        const activeBrands = brandsData.filter(
          (brand) => brand.status !== "INACTIVE",
        );

        const activeCategories = categoriesData.filter(
          (category) => category.status !== "INACTIVE",
        );

        const activeBrandIds = activeBrands.map((brand) => brand.id);
        const activeCategoryIds = activeCategories.map(
          (category) => category.id,
        );

        const activeProducts = productsData.filter(
          (product) =>
            product.status !== "INACTIVE" &&
            activeBrandIds.includes(product.brandId) &&
            activeCategoryIds.includes(product.categoryId),
        );

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

  const getProductCountByBrand = (brandIdValue) => {
    return products.filter((product) => product.brandId === brandIdValue)
      .length;
  };

  const selectedBrand = brands.find((item) => String(item.id) === brandId);

  const getFilteredProducts = () => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchBrand = !brandId || String(product.brandId) === brandId;

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

      return matchBrand && matchPrice && matchKeyword;
    });

    result = [...result].sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
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

  const heading = selectedBrand
    ? `Thương hiệu ${selectedBrand.name}`
    : "Thương hiệu sản phẩm";
  const addToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const exist = cart.find((item) => item.id === product.id);

    if (exist) {
      // Nếu số lượng sau khi cộng vượt tồn kho
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

      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Đã thêm sản phẩm vào giỏ hàng!");
  };

  return (
    <main className="brand-page">
      <nav className="brand-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <strong>Thương hiệu</strong>
      </nav>

      <header className="brand-heading">
        <div>
          <h1>{heading}</h1>
          <p>
            {priceRange ? `Khoảng giá ${priceRange} · ` : ""}
            {filteredProducts.length} sản phẩm phù hợp
          </p>
        </div>
      </header>

      <div className="brand-layout">
        <aside className="brand-sidebar">
          <div className="filter-panel">
            <div className="filter-title">
              <h2>Thương hiệu</h2>
              <span>+</span>
            </div>

            <label className={!brandId ? "is-checked" : ""}>
              <input
                type="radio"
                checked={!brandId}
                onChange={() => updateParam("id", "")}
              />
              Tất cả thương hiệu
            </label>

            {brands.map((brand) => (
              <label
                key={brand.id}
                className={brandId === String(brand.id) ? "is-checked" : ""}
              >
                <input
                  type="radio"
                  checked={brandId === String(brand.id)}
                  onChange={() => updateParam("id", String(brand.id))}
                />

                {brand.name}

                <span className="brand-count">
                  ({getProductCountByBrand(brand.id)})
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
                checked={!priceRange}
                onChange={() => updateParam("price", "")}
              />
              Tất cả
            </label>

            <label className={priceRange === "0-5" ? "is-checked" : ""}>
              <input
                type="radio"
                checked={priceRange === "0-5"}
                onChange={() => updateParam("price", "0-5")}
              />
              Từ 0 - 5 triệu
            </label>

            <label className={priceRange === "5-10" ? "is-checked" : ""}>
              <input
                type="radio"
                checked={priceRange === "5-10"}
                onChange={() => updateParam("price", "5-10")}
              />
              Từ 5 - 10 triệu
            </label>

            <label className={priceRange === "10+" ? "is-checked" : ""}>
              <input
                type="radio"
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

        <section className="brand-content">
          <div className="brand-strip">
            <Link
              className={`brand-card view-all ${!brandId ? "active" : ""}`}
              to="/brands"
            >
              <span>+</span>
              <small>Tất cả</small>
            </Link>

            {brands.map((brand) => {
              const logo = getBrandImage(logoFileName(brand.name));

              return (
                <Link
                  key={brand.id}
                  className={`brand-card ${
                    brandId === String(brand.id) ? "active" : ""
                  }`}
                  to={`/brands?id=${brand.id}`}
                >
                  {logo ? (
                    <img src={logo} alt={brand.name} />
                  ) : (
                    <span className="brand-text-logo">{brand.name}</span>
                  )}

                  <small>{brand.name}</small>
                </Link>
              );
            })}
          </div>

          <div className="brand-result-head">
            <div>
              <h2>
                Danh sách sản phẩm
                <span> ({filteredProducts.length})</span>
              </h2>

              <p>
                {loading
                  ? "Đang tải dữ liệu..."
                  : "Lọc sản phẩm theo thương hiệu."}
              </p>
            </div>

            <form
              className="category-product-search-form"
              onSubmit={handleSearch}
            >
              <input
                defaultValue={keyword}
                name="keyword"
                placeholder="Tìm sản phẩm..."
              />

              <button>Tìm kiếm</button>
            </form>

            <label>
              Sắp xếp
              <select
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
              >
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="brand-product-grid product-grid">
            {loading ? (
              <div className="brand-empty">
                <h3>Đang tải sản phẩm...</h3>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <figure>
                    <img
                      src={getProductImage(product.image)}
                      alt={product.name}
                    />
                  </figure>

                  <h3>{product.name}</h3>

                  <strong>{product.price.toLocaleString("vi-VN")}đ</strong>

                  <p
                    className={`product-stock ${
                      product.stock > 0 ? "in-stock" : "out-of-stock"
                    }`}
                  >
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
              <div className="brand-empty">
                <h3>Không tìm thấy sản phẩm</h3>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
