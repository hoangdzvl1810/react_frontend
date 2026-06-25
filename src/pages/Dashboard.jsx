import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('account'));
        if (!user || user.role !== 'ADMIN') {
            navigate('/login');
            return;
        }

        const fetchStats = async () => {
            try {
                const prodRes = await axios.get('http://localhost:3001/products');
                const orderRes = await axios.get('http://localhost:3001/orders');
                const userRes = await axios.get('http://localhost:3001/users');
                
                setStats({
                    products: prodRes.data.length,
                    orders: orderRes.data.length,
                    users: userRes.data.length
                });
            } catch (err) {
                console.error("Lỗi lấy dữ liệu thống kê", err);
            }
        };
        fetchStats();
    }, [navigate]);

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Admin Dashboard</h2>
            
            <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                <div style={{ flex: 1, padding: '40px 20px', backgroundColor: '#e3f2fd', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <i className="fa-solid fa-microchip" style={{ fontSize: '40px', color: '#1565c0', marginBottom: '15px' }}></i>
                    <h3 style={{ color: '#555' }}>Sản Phẩm Trong Kho</h3>
                    <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#1565c0', marginTop: '10px' }}>{stats.products}</p>
                </div>

                <div style={{ flex: 1, padding: '40px 20px', backgroundColor: '#e8f5e9', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '40px', color: '#2e7d32', marginBottom: '15px' }}></i>
                    <h3 style={{ color: '#555' }}>Đơn Hàng</h3>
                    <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#2e7d32', marginTop: '10px' }}>{stats.orders}</p>
                </div>

                <div style={{ flex: 1, padding: '40px 20px', backgroundColor: '#fff3e0', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: '40px', color: '#ef6c00', marginBottom: '15px' }}></i>
                    <h3 style={{ color: '#555' }}>Khách Hàng</h3>
                    <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef6c00', marginTop: '10px' }}>{stats.users}</p>
                </div>
            </div>
        </div>
    );
}
