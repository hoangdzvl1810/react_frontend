import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:3001/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProduct();
    }, [id]);

    const addToCart = () => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const exist = cart.find(item => item.id === product.id);
        if (exist) {
            exist.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm sản phẩm vào giỏ hàng!');
        // Reload lại trang nhẹ hoặc redirect tới cart để Header cập nhật số lượng giỏ hàng
        navigate('/cart');
    };

    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
            <div style={{ display: 'flex', gap: '50px', backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <img src={`/assets/images/${product.image}`} alt={product.name} style={{ width: '100%', maxWidth: '400px', objectFit: 'contain' }} onError={(e) => e.target.src='https://via.placeholder.com/400'} />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '28px', marginBottom: '15px' }}>{product.name}</h2>
                    <h3 style={{ color: '#e53e3e', fontSize: '24px', marginBottom: '20px' }}>{product.price.toLocaleString('vi-VN')}đ</h3>
                    
                    <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                        <p><strong>Thương hiệu:</strong> {product.brandId === 1 ? 'Asus' : 'Khác'}</p>
                        <p><strong>Trạng thái:</strong> {product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Tạm hết hàng'}</p>
                        <p><strong>Mô tả chi tiết:</strong> {product.description}</p>
                    </div>

                    <button 
                        onClick={addToCart} 
                        className="btn-submit" 
                        style={{ width: '250px', fontSize: '16px', padding: '12px' }} 
                        disabled={product.stock <= 0}
                    >
                        <i className="fa-solid fa-cart-plus"></i> THÊM VÀO GIỎ HÀNG
                    </button>
                </div>
            </div>
        </div>
    );
}
