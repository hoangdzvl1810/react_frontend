import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCollection } from '../services/api';
import { getBrandImage } from '../utils/brandImages';
import { getProductImage } from '../utils/productImages';

const SORT_OPTIONS = {
    default: 'Mặc định',
    priceAsc: 'Giá thấp đến cao',
    priceDesc: 'Giá cao đến thấp',
    nameAsc: 'Tên A-Z',
    nameDesc: 'Tên Z-A',
};

const logoFileName = (brandName) => `${brandName.toLowerCase()}.png`;

export default function Brands() {
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const brandId = searchParams.get('id') || '';
    const categoryId = searchParams.get('category') || '';
    const keyword = searchParams.get('keyword') || '';
    const sort = searchParams.get('sort') || 'default';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [brandsData, categoriesData, productsData] = await Promise.all([
                    getCollection('brands'),
                    getCollection('categories'),
                    getCollection('products'),
                ]);

                setBrands(brandsData);
                setCategories(categoriesData);
                setProducts(productsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const productCountByBrand = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.brandId] = (acc[product.brandId] || 0) + 1;
            return acc;
        }, {});
    }, [products]);

    const selectedBrand = brands.find(item => String(item.id) === brandId);
    const selectedCategory = categories.find(item => String(item.id) === categoryId);

    const filteredProducts = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        const result = products.filter(product => {
            const matchBrand = !brandId || String(product.brandId) === brandId;
            const matchCategory = !categoryId || String(product.categoryId) === categoryId;
            const matchKeyword =
                !normalizedKeyword ||
                product.name.toLowerCase().includes(normalizedKeyword) ||
                product.description?.toLowerCase().includes(normalizedKeyword);

            return matchBrand && matchCategory && matchKeyword;
        });

        return [...result].sort((a, b) => {
            if (sort === 'priceAsc') return a.price - b.price;
            if (sort === 'priceDesc') return b.price - a.price;
            if (sort === 'nameAsc') return a.name.localeCompare(b.name);
            if (sort === 'nameDesc') return b.name.localeCompare(a.name);
            return a.id - b.id;
        });
    }, [brandId, categoryId, keyword, products, sort]);

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
        updateParam('keyword', formData.get('keyword').trim());
    };

    const clearFilters = () => {
        setSearchParams({});
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const exist = cart.find(item => item.id === product.id);

        if (exist) {
            exist.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    };

    const heading = selectedBrand ? `Thương hiệu ${selectedBrand.name}` : 'Thương hiệu sản phẩm';

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
                        {selectedCategory ? `${selectedCategory.name} · ` : ''}
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
                        <label className={!brandId ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="brand"
                                checked={!brandId}
                                onChange={() => updateParam('id', '')}
                            />
                            Tất cả thương hiệu
                        </label>
                        {brands.map(brand => (
                            <label className={brandId === String(brand.id) ? 'is-checked' : ''} key={brand.id}>
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={brandId === String(brand.id)}
                                    onChange={() => updateParam('id', String(brand.id))}
                                />
                                {brand.name}
                                <span className="brand-count">({productCountByBrand[brand.id] || 0})</span>
                            </label>
                        ))}
                    </div>

                    <div className="filter-panel">
                        <div className="filter-title">
                            <h2>Danh mục</h2>
                            <span>+</span>
                        </div>
                        <label className={!categoryId ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="category"
                                checked={!categoryId}
                                onChange={() => updateParam('category', '')}
                            />
                            Tất cả
                        </label>
                        {categories.map(category => (
                            <label className={categoryId === String(category.id) ? 'is-checked' : ''} key={category.id}>
                                <input
                                    type="radio"
                                    name="category"
                                    checked={categoryId === String(category.id)}
                                    onChange={() => updateParam('category', String(category.id))}
                                />
                                {category.name}
                            </label>
                        ))}
                        <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
                    </div>
                </aside>

                <section className="brand-content">
                    <div className="brand-strip">
                        <Link className={`brand-card view-all ${!brandId ? 'active' : ''}`} to="/brands">
                            <span>+</span>
                            <small>Tất cả</small>
                        </Link>
                        {brands.map(brand => {
                            const logo = getBrandImage(logoFileName(brand.name));

                            return (
                                <Link
                                    className={`brand-card ${brandId === String(brand.id) ? 'active' : ''}`}
                                    to={`/brands?id=${brand.id}`}
                                    key={brand.id}
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
                                Danh sách sản phẩm <span>({filteredProducts.length})</span>
                            </h2>
                            <p>{loading ? 'Đang tải dữ liệu...' : 'Lọc sản phẩm theo thương hiệu và danh mục.'}</p>
                        </div>

                        <form className="brand-product-search-form" onSubmit={handleSearch}>
                            <input
                                key={keyword}
                                type="text"
                                name="keyword"
                                defaultValue={keyword}
                                placeholder="Tìm sản phẩm..."
                            />
                            <button type="submit">Tìm kiếm</button>
                        </form>

                        <label>
                            Sắp xếp
                            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                    <option value={value} key={value}>{label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <section className="brand-product-grid product-grid">
                        {loading ? (
                            <div className="brand-empty">
                                <h3>Đang tải sản phẩm</h3>
                                <p>Vui lòng chờ trong giây lát.</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <article className="product-card" key={product.id}>
                                    <figure>
                                        <img
                                            src={getProductImage(product.image)}
                                            alt={product.name}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                                        />
                                    </figure>
                                    <h3>{product.name}</h3>
                                    <strong>{product.price.toLocaleString('vi-VN')}đ</strong>
                                    <p className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                        {product.stock > 0 ? `Còn hàng: ${product.stock}` : 'Hết hàng'}
                                    </p>
                                    <div className="product-actions">
                                        <Link className="detail-btn" to={`/product-detail/${product.id}`}>Chi tiết</Link>
                                        <button
                                            className="cart-btn"
                                            type="button"
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock <= 0}
                                            title="Thêm vào giỏ hàng"
                                        >
                                            <i className="fa-solid fa-cart-plus"></i>
                                        </button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="brand-empty">
                                <h3>Không tìm thấy sản phẩm</h3>
                                <p>Thử chọn thương hiệu khác hoặc xóa bộ lọc.</p>
                            </div>
                        )}
                    </section>
                </section>
            </div>
        </main>
    );
}
