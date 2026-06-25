import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.body.className = 'login-page';
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // json-server lọc theo field (ở db.json chúng ta đặt field là username)
            const res = await axios.get(`http://localhost:3001/users?username=${email}&password=${password}`);
            if (res.data.length > 0) {
                const user = res.data[0];
                // Lưu vào LocalStorage
                localStorage.setItem('account', JSON.stringify(user));
                // Reload lại toàn bộ trang để Header nhận data
                window.location.href = '/';
            } else {
                setError('Tài khoản hoặc mật khẩu không chính xác!');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server!');
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '50px 0' }}>
            <div className="home-navigation" style={{ marginBottom: '20px', marginLeft: '50px' }}>
                <Link to="/" className="home-link">Home</Link>
            </div>

            <div className="card-container" style={{ margin: '0 auto' }}>
                <h2 className="card-title">Chào mừng trở lại!</h2>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Tài khoản (Email / Username)</label>
                        <div className="input-group">
                            <i className="fa-regular fa-envelope left-icon"></i>
                            <input 
                                type="text" 
                                id="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Nhập: admin hoặc khachhang1" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="input-group">
                            <i className="fa-solid fa-lock left-icon"></i>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Nhập: 123" 
                                required 
                                className="pass-input" 
                            />
                            <i 
                                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`} 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ cursor: 'pointer' }}
                            ></i>
                        </div>
                    </div>

                    <div className="forgot-password-container">
                        <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="btn-submit">Đăng nhập</button>
                </form>

                {error && (
                    <div style={{ color: 'red', textAlign: 'center', marginTop: '15px' }}>
                        {error}
                    </div>
                )}

                <div className="footer-text" style={{ marginTop: '20px' }}>
                    Bạn chưa có tài khoản?
                    <Link to="/register"> Đăng ký</Link>
                </div>
            </div>
        </div>
    );
}
