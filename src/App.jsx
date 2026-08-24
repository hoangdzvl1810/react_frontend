import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import Dashboard from './pages/Dashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from "./pages/AdminOrders";
import AdminCategories from "./pages/AdminCategories";
import AdminBrands from "./pages/AdminBrands";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// Import CSS
import './assets/css/style.css';
import './assets/css/toast-modal.css';
import './assets/css/admin-layout.css';
import './assets/css/admin-products.css';
import './assets/css/categories.css';
import './assets/css/brands.css';
import './assets/css/product-detail.css';
import './assets/css/admin-categories.css';
import './assets/css/cart-checkout.css';
import './assets/css/dashboard-upgrade.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Customer storefront layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="categories" element={<Categories />} />
                <Route path="brands" element={<Brands />} />
                <Route path="product-detail/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="order-history"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Dedicated Admin layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
