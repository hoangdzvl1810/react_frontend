import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollection } from '../services/api';

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
            const users = await getCollection('users');
            const user = users.find(item =>
                (item.email === email || item.username === email) &&
                item.password === password
            );

            if (user) {
                // Lưu vào LocalStorage
                localStorage.setItem('account', JSON.stringify(user));
                // Reload lại toàn bộ trang để Header nhận data
                window.location.href = '/';
            } else {
                setError('Tài khoản hoặc mật khẩu không chính xác!');
            }
        } catch (err) {
            setError('Lỗi đăng nhập, vui lòng thử lại!');
        }
    };

    return (
        <main className="auth-page">
            <Link to="/" className="auth-back-link">
                <i className="fa-solid fa-arrow-left"></i>
                Trang chủ
            </Link>

            <section className="auth-card auth-card-compact">
                <div className="auth-card-header">
                    <div className="auth-logo">P</div>
                    <h1>Chào mừng trở lại</h1>
                    <p>Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng.</p>
                </div>

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <div className="auth-input">
                            <i className="fa-regular fa-envelope auth-input-icon"></i>
                            <input 
                                type="text" 
                                id="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Nhập email của bạn" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="auth-input">
                            <i className="fa-solid fa-lock auth-input-icon"></i>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Nhập: 123" 
                                required 
                            />
                            <button
                                type="button"
                                className="auth-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="forgot-password-container">
                        <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="auth-submit">Đăng nhập</button>
                </form>

                {error && (
                    <div className="auth-message error">
                        {error}
                    </div>
                )}

                <div className="auth-footer">
                    Bạn chưa có tài khoản?
                    <Link to="/register"> Đăng ký</Link>
                </div>
            </section>
        </main>
    );
}
