import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    
    useEffect(() => {
        const fetchOrders = async () => {
            const user = JSON.parse(localStorage.getItem('account'));
            if (!user) return;
            try {
                // json-server lọc theo userId
                const res = await axios.get(`http://localhost:3001/orders?userId=${user.id}&_sort=date&_order=desc`);
                setOrders(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchOrders();
    }, []);

    const user = JSON.parse(localStorage.getItem('account'));
    if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>Vui lòng đăng nhập để xem lịch sử đơn hàng. <Link to="/login">Đăng nhập</Link></div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
            <h2 style={{ marginBottom: '20px' }}>Lịch Sử Đơn Hàng Của Bạn</h2>
            
            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '10px' }}>
                    <p>Bạn chưa có đơn hàng nào.</p>
                    <Link to="/categories" className="btn-submit" style={{ display: 'inline-block', width: '200px', marginTop: '15px' }}>Mua sắm ngay</Link>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
                                <th style={{ padding: '15px' }}>Mã đơn hàng</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>#{order.id}</td>
                                    <td>{new Date(order.date).toLocaleString('vi-VN')}</td>
                                    <td style={{ color: '#e53e3e', fontWeight: 'bold' }}>{order.totalPrice.toLocaleString('vi-VN')}đ</td>
                                    <td>
                                        <span style={{ 
                                            padding: '5px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '14px',
                                            backgroundColor: order.status === 'Đang xử lý' ? '#fff3cd' : '#d4edda',
                                            color: order.status === 'Đang xử lý' ? '#856404' : '#155724'
                                        }}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
