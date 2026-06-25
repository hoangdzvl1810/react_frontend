import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cart() {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
    }, []);

    const updateQuantity = (id, delta) => {
        let newCart = cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return { ...item, quantity: newQty > 0 ? newQty : 1 };
            }
            return item;
        });
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeItem = (id) => {
        let newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
            <h2 style={{ marginBottom: '20px' }}>Giỏ Hàng Của Bạn</h2>
            
            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '10px' }}>
                    <i className="fa-solid fa-cart-shopping" style={{ fontSize: '50px', color: '#ccc', marginBottom: '20px' }}></i>
                    <p>Giỏ hàng của bạn đang trống.</p>
                    <Link to="/categories" className="btn-submit" style={{ display: 'inline-block', width: '200px', marginTop: '15px' }}>Tiếp tục mua sắm</Link>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '15px 10px' }}>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                                <th>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={`/assets/images/${item.image}`} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} onError={(e) => e.target.src='https://via.placeholder.com/60'} />
                                        <Link to={`/product-detail/${item.id}`} style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>{item.name}</Link>
                                    </td>
                                    <td>{item.price.toLocaleString('vi-VN')}đ</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '5px 10px', cursor: 'pointer', border: '1px solid #ddd', background: '#f9f9f9' }}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '5px 10px', cursor: 'pointer', border: '1px solid #ddd', background: '#f9f9f9' }}>+</button>
                                        </div>
                                    </td>
                                    <td style={{ color: '#e53e3e', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                    <td>
                                        <button onClick={() => removeItem(item.id)} style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', fontSize: '18px' }}>
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ marginTop: '30px', textAlign: 'right', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Tổng thanh toán: <span style={{ color: '#e53e3e' }}>{total.toLocaleString('vi-VN')}đ</span></h3>
                        <Link to="/checkout" className="btn-submit" style={{ display: 'inline-block', width: '250px', textDecoration: 'none', textAlign: 'center' }}>Tiến hành đặt hàng</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
