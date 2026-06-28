import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (path === '/') {
            document.body.className = 'home-page';
        } else if (path.includes('categories')) {
            document.body.className = 'categories-page';
        } else if (path.includes('brands')) {
            document.body.className = 'brands-page';
        } else if (path.includes('product-detail')) {
            document.body.className = 'product-detail-body';
        } else if (path.includes('cart')) {
            document.body.className = 'cart-page';
        } else if (path.includes('checkout')) {
            document.body.className = 'checkout-page';
        } else if (path.includes('order-history')) {
            document.body.className = 'order-history-body';
        } else if (path.includes('dashboard')) {
            document.body.className = 'dashboard-body';
        } else if (path.includes('admin')) {
            document.body.className = 'admin-product-body';
        } else {
            document.body.className = '';
        }
    }, [location.pathname]);

    return (
        <div>
            <Header />
            <Outlet />
            <Footer />
        </div>
    );
}
