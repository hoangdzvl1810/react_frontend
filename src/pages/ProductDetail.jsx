import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCollection, getItem } from '../services/api';
import { getProductImage } from '../utils/productImages';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [brand, setBrand] = useState(null);
    const [category, setCategory] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                setLoading(true);
                const [productData, brandsData, categoriesData, productsData] = await Promise.all([
                    getItem('products', id),
                    getCollection('brands'),
                    getCollection('categories'),
                    getCollection('products'),
                ]);

                setProduct(productData);
                setBrand(brandsData.find(item => item.id === productData?.brandId) || null);
                setCategory(categoriesData.find(item => item.id === productData?.categoryId) || null);
                setSimilarProducts(
                    productsData
                        .filter(item => item.categoryId === productData?.categoryId && item.id !== productData?.id)
                        .slice(0, 4)
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetail();
    }, [id]);

    const addToCart = (goToCart = false) => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const exist = cart.find(item => item.id === product.id);

        if (exist) {
            exist.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm sản phẩm vào giỏ hàng!');

        if (goToCart) {
            navigate('/cart');
        }
    };

    const handleQuantityChange = (e) => {
        const value = Number(e.target.value);
        setQuantity(Math.min(Math.max(value, 1), product.stock));
    };

    if (loading) {
        return <main className="product-detail-page"><div className="empty-similar">Đang tải dữ liệu...</div></main>;
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
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400'}
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
                            <span className="meta-value">{brand?.name || 'Đang cập nhật'}</span>
                        </span>
                        <span className="meta-divider">|</span>
                        <span className="meta-item">
                            <span className="meta-label">Danh mục:</span>
                            <span className="meta-value">{category?.name || 'Đang cập nhật'}</span>
                        </span>
                    </div>

                    <div className="rating-row">
                        <span className="rating-badge">4.8</span>
                        <span className="stars">
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star-half-stroke"></i>
                        </span>
                        <span className="review-count">12 đánh giá</span>
                    </div>

                    <div className="price">{product.price.toLocaleString('vi-VN')}đ</div>

                    <div className="stock-status">
                        <span className={`badge-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                            {product.stock > 0 ? 'Còn hàng' : 'Tạm hết hàng'}
                        </span>
                        <span className="quantity-text">
                            {product.stock > 0 ? `${product.stock} sản phẩm có sẵn` : 'Vui lòng quay lại sau'}
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
                                    <i className="fa-solid fa-cart-plus"></i>
                                    Thêm giỏ
                                </button>
                                <button
                                    type="button"
                                    className="buy-btn"
                                    onClick={() => addToCart(true)}
                                    disabled={product.stock <= 0}
                                >
                                    <i className="fa-solid fa-bag-shopping"></i>
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
                        <p>{product.description || 'Sản phẩm đang được cập nhật mô tả chi tiết.'}</p>
                    </div>
                </div>
            </section>

            <section className="similar-card">
                <div className="similar-header">
                    <h2>Sản phẩm cùng danh mục</h2>
                    <p>{category ? `Các lựa chọn khác trong ${category.name}` : 'Các lựa chọn liên quan'}</p>
                </div>

                {similarProducts.length > 0 ? (
                    <div className="similar-products-row">
                        {similarProducts.map(item => (
                            <Link className="similar-product-item" to={`/product-detail/${item.id}`} key={item.id}>
                                <div className="similar-product-img">
                                    <img
                                        src={getProductImage(item.image)}
                                        alt={item.name}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/180'}
                                    />
                                </div>
                                <h3>{item.name}</h3>
                                <span className="similar-price">{item.price.toLocaleString('vi-VN')}đ</span>
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
