import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
        const storedUser = JSON.parse(localStorage.getItem('account'));
        if (storedUser) setUser(storedUser);
    }, []);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Vui lòng đăng nhập để tiến hành thanh toán!');
            navigate('/login');
            return;
        }

        const newOrder = {
            userId: user.id,
            address,
            phone,
            totalPrice: total,
            status: "Đang xử lý",
            date: new Date().toISOString(),
            items: cart
        };

        try {
            await axios.post('http://localhost:3001/orders', newOrder);
            localStorage.removeItem('cart'); // Xóa giỏ hàng sau khi đặt thành công
            alert('Đặt hàng thành công!');
            navigate('/order-history');
        } catch (err) {
            alert('Có lỗi xảy ra khi đặt hàng.');
        }
    };

    if (cart.length === 0) return <div style={{ padding: '50px', textAlign: 'center' }}>Giỏ hàng trống, không thể thanh toán!</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
            <h2 style={{ marginBottom: '20px' }}>Thanh Toán Đơn Hàng</h2>
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input type="text" value={user?.fullName || ''} readOnly className="search-input" style={{ width: '100%', backgroundColor: '#f0f0f0' }} />
                    </div>
                    
                    <div className="form-group">
                        <label>Địa chỉ giao hàng (*)</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="search-input" style={{ width: '100%' }} placeholder="Ví dụ: 123 Đường ABC, Quận XYZ..." />
                    </div>

                    <div className="form-group">
                        <label>Số điện thoại liên hệ (*)</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="search-input" style={{ width: '100%' }} placeholder="Nhập số điện thoại..." />
                    </div>
                    
                    <div style={{ borderTop: '2px solid #eee', marginTop: '10px', paddingTop: '20px', textAlign: 'right' }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Tổng thanh toán: <span style={{ color: '#e53e3e' }}>{total.toLocaleString('vi-VN')}đ</span></h3>
                        <button type="submit" className="btn-submit" style={{ width: '250px' }}>Xác nhận đặt hàng</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
