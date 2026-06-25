import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Lấy dữ liệu từ json-server
        const fetchData = async () => {
            try {
                const catRes = await axios.get('http://localhost:3001/categories');
                setCategories(catRes.data);

                const prodRes = await axios.get('http://localhost:3001/products');
                setProducts(prodRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <main className="page-shell">
            <aside className="sidebar">
                <h2>DANH MỤC SẢN PHẨM</h2>
                <ul className="category-list">
                    {categories.map(category => (
                        <li key={category.id}>
                            <Link to={`/categories?id=${category.id}`}>
                                {category.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link className="all-categories" to="/categories">
                    ▦ Xem tất cả danh mục
                </Link>
            </aside>

            <section className="content">
                <section className="hero-banner">
                    <div className="hero-copy">
                        <p>ProBUILD PC</p>
                        <h1>ĐỈNH CAO HIỆU NĂNG<br />NÂNG TẦM TRẢI NGHIỆM</h1>
                        <span>TRỐN NẮNG TRONG PHÒNG - BUILD PC ĐỈNH DÒNG</span>
                    </div>
                </section>

                <section className="service-row">
                    <article>
                        <span><i className="fa-solid fa-shield-halved"></i></span>
                        <div>
                            <strong>Hàng chính hãng</strong>
                            <small>100% chính hãng</small>
                        </div>
                    </article>
                    <article>
                        <span><i className="fa-solid fa-rotate"></i></span>
                        <div>
                            <strong>Bảo hành uy tín</strong>
                            <small>Bảo hành chính hãng</small>
                        </div>
                    </article>
                    <article>
                        <span><i className="fa-solid fa-truck-fast"></i></span>
                        <div>
                            <strong>Giao hàng toàn quốc</strong>
                            <small>Miễn phí đơn từ 1 triệu</small>
                        </div>
                    </article>
                    <article>
                        <span><i className="fa-solid fa-headset"></i></span>
                        <div>
                            <strong>Hỗ trợ 24/7</strong>
                            <small>Tư vấn tận tâm</small>
                        </div>
                    </article>
                </section>

                <section className="product-grid">
                    {products.length > 0 ? products.map(product => (
                        <article className="product-card" key={product.id}>
                            <figure>
                                <img src={`/assets/images/${product.image}`} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }} />
                            </figure>
                            <h3>{product.name}</h3>
                            <strong>{product.price.toLocaleString('vi-VN')}đ</strong>
                            <p className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                                {product.stock > 0 ? `Còn hàng: ${product.stock}` : "Hết hàng"}
                            </p>
                            <div className="product-actions">
                                <Link className="detail-btn" to={`/product-detail/${product.id}`}>Xem chi tiết</Link>
                                <button className="cart-btn" disabled={product.stock <= 0}>
                                    <i className="fa-solid fa-cart-shopping"></i>
                                </button>
                            </div>
                        </article>
                    )) : (
                        <p className="home-empty-message">Không có sản phẩm nào để hiển thị.</p>
                    )}
                </section>
            </section>
        </main>
    );
}
