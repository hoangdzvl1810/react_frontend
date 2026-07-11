import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
// Import CSS
import './assets/css/style.css';
import './assets/css/admin-products.css';
import './assets/css/categories.css';
import './assets/css/brands.css';
import './assets/css/product-detail.css';
import "./assets/css/admin-categories.css";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="product-detail/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-history" element={<OrderHistory />} />
          <Route path="profile" element={<Profile />} />
          {/* Admin Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin/products" element={<AdminProducts />} />
          <Route path="admin/orders" element={<AdminOrders />} />
          <Route path="admin/categories" element={<AdminCategories />} />
          <Route path="admin/brands" element={<AdminBrands />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
