import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCollection } from '../services/api';
import { getProductImage } from '../utils/productImages';

const SORT_OPTIONS = {
    default: 'Mặc định',
    priceAsc: 'Giá thấp đến cao',
    priceDesc: 'Giá cao đến thấp',
    nameAsc: 'Tên A-Z',
    nameDesc: 'Tên Z-A',
};

export default function Categories() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const categoryId = searchParams.get('id') || '';
    const brandId = searchParams.get('brand') || '';
    const stockStatus = searchParams.get('stock') || '';
    const keyword = searchParams.get('keyword') || '';
    const sort = searchParams.get('sort') || 'default';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [categoriesData, brandsData, productsData] = await Promise.all([
                    getCollection('categories'),
                    getCollection('brands'),
                    getCollection('products'),
                ]);

                setCategories(categoriesData);
                setBrands(brandsData);
                setProducts(productsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const productCountByCategory = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.categoryId] = (acc[product.categoryId] || 0) + 1;
            return acc;
        }, {});
    }, [products]);

    const productCountByBrand = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.brandId] = (acc[product.brandId] || 0) + 1;
            return acc;
        }, {});
    }, [products]);

    const selectedCategory = categories.find(item => String(item.id) === categoryId);
    const selectedBrand = brands.find(item => String(item.id) === brandId);

    const filteredProducts = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        const result = products.filter(product => {
            const matchCategory = !categoryId || String(product.categoryId) === categoryId;
            const matchBrand = !brandId || String(product.brandId) === brandId;
            const matchStock =
                !stockStatus ||
                (stockStatus === 'in' && product.stock > 0) ||
                (stockStatus === 'out' && product.stock <= 0);
            const matchKeyword =
                !normalizedKeyword ||
                product.name.toLowerCase().includes(normalizedKeyword) ||
                product.description?.toLowerCase().includes(normalizedKeyword);

            return matchCategory && matchBrand && matchStock && matchKeyword;
        });

        return [...result].sort((a, b) => {
            if (sort === 'priceAsc') return a.price - b.price;
            if (sort === 'priceDesc') return b.price - a.price;
            if (sort === 'nameAsc') return a.name.localeCompare(b.name);
            if (sort === 'nameDesc') return b.name.localeCompare(a.name);
            return a.id - b.id;
        });
    }, [brandId, categoryId, keyword, products, sort, stockStatus]);

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

    const heading = keyword
        ? `Kết quả cho "${keyword}"`
        : selectedCategory?.name || 'Tất cả sản phẩm';

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
                        {selectedBrand ? `Thương hiệu ${selectedBrand.name} · ` : ''}
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
                        <label className={!categoryId ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="category"
                                checked={!categoryId}
                                onChange={() => updateParam('id', '')}
                            />
                            Tất cả
                            <span className="category-count">({products.length})</span>
                        </label>
                        {categories.map(category => (
                            <label className={categoryId === String(category.id) ? 'is-checked' : ''} key={category.id}>
                                <input
                                    type="radio"
                                    name="category"
                                    checked={categoryId === String(category.id)}
                                    onChange={() => updateParam('id', String(category.id))}
                                />
                                {category.name}
                                <span className="category-count">({productCountByCategory[category.id] || 0})</span>
                            </label>
                        ))}
                    </div>

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
                                onChange={() => updateParam('brand', '')}
                            />
                            Tất cả
                        </label>
                        {brands.map(brand => (
                            <label className={brandId === String(brand.id) ? 'is-checked' : ''} key={brand.id}>
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={brandId === String(brand.id)}
                                    onChange={() => updateParam('brand', String(brand.id))}
                                />
                                {brand.name}
                                <span className="category-count">({productCountByBrand[brand.id] || 0})</span>
                            </label>
                        ))}
                    </div>

                    <div className="filter-panel">
                        <div className="filter-title">
                            <h2>Tình trạng</h2>
                            <span>+</span>
                        </div>
                        <label className={!stockStatus ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="stock"
                                checked={!stockStatus}
                                onChange={() => updateParam('stock', '')}
                            />
                            Tất cả
                        </label>
                        <label className={stockStatus === 'in' ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="stock"
                                checked={stockStatus === 'in'}
                                onChange={() => updateParam('stock', 'in')}
                            />
                            Còn hàng
                        </label>
                        <label className={stockStatus === 'out' ? 'is-checked' : ''}>
                            <input
                                type="radio"
                                name="stock"
                                checked={stockStatus === 'out'}
                                onChange={() => updateParam('stock', 'out')}
                            />
                            Hết hàng
                        </label>
                        <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
                    </div>
                </aside>

                <section className="category-content">
                    <div className="category-result-head">
                        <div>
                            <h2>
                                Danh sách sản phẩm <span>({filteredProducts.length})</span>
                            </h2>
                            <p>{loading ? 'Đang tải dữ liệu...' : 'Chọn bộ lọc để tìm linh kiện phù hợp.'}</p>
                        </div>

                        <form className="category-product-search-form" onSubmit={handleSearch}>
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
                            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                    <option value={value} key={value}>{label}</option>
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
                            filteredProducts.map(product => (
                                <article className="category-product-card" key={product.id}>
                                    <Link className="category-product-image" to={`/product-detail/${product.id}`}>
                                        <img
                                            src={getProductImage(product.image)}
                                            alt={product.name}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                                        />
                                    </Link>
                                    <h3>
                                        <Link to={`/product-detail/${product.id}`}>{product.name}</Link>
                                    </h3>
                                    <strong>{product.price.toLocaleString('vi-VN')}đ</strong>
                                    <p className="stock">
                                        {product.stock > 0 ? `Còn hàng: ${product.stock}` : 'Hết hàng'}
                                    </p>
                                    <div className="card-actions">
                                        <Link className="detail-link" to={`/product-detail/${product.id}`}>
                                            <i className="fa-regular fa-eye"></i>
                                            Chi tiết
                                        </Link>
                                        <button
                                            className="add-to-cart-btn"
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
