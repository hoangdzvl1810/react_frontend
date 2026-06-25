import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer-container">
                <div className="footer-column">
                    <h3>VỀ PROBUILD PC</h3>
                    <Link to="#">Giới thiệu</Link>
                    <Link to="#">Tuyển dụng</Link>
                    <Link to="#">Liên hệ</Link>
                </div>

                <div className="footer-column">
                    <h3>CHÍNH SÁCH</h3>
                    <Link to="#">Chính sách bảo hành</Link>
                    <Link to="#">Chính sách giao hàng</Link>
                    <Link to="#">Chính sách bảo mật</Link>
                </div>

                <div className="footer-column">
                    <h3>THÔNG TIN</h3>
                    <Link to="#">Hệ thống cửa hàng</Link>
                    <Link to="#">Hướng dẫn mua hàng</Link>
                    <Link to="#">Hướng dẫn thanh toán</Link>
                    <Link to="#">Tra cứu địa chỉ bảo hành</Link>
                    <Link to="#">Build PC</Link>
                </div>

                <div className="footer-column footer-support">
                    <h3>TỔNG ĐÀI HỖ TRỢ <span>(8:00 - 21:00)</span></h3>
                    <p>Mua hàng: <a href="tel:0368176253">0368.176.253</a></p>
                    <p>Bảo hành: <a href="tel:0368176253">0368.176.253</a></p>
                    <p>Khiếu nại: <a href="tel:0368176253">0368.176.253</a></p>
                    <p>Email: <a href="mailto:proBuildPC@gmail.com">proBuildPC@gmail.com</a></p>
                </div>

                <div className="footer-column">
                    <h3>ĐƠN VỊ VẬN CHUYỂN</h3>
                    <div className="footer-badge-row">
                        <span>GHN</span>
                        <span>EMS</span>
                        <span>GVN</span>
                    </div>

                    <h3 className="footer-payment-title">CÁCH THỨC THANH TOÁN</h3>
                    <div className="footer-payment-grid">
                        <span>Banking</span>
                        <span>JCB</span>
                        <span>MasterCard</span>
                        <span>ZaloPay</span>
                        <span>Tiền mặt</span>
                        <span>Trả góp</span>
                        <span>VISA</span>
                        <span>MoMo</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
