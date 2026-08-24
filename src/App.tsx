/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Contact from './pages/Contact';
import About from './pages/About';
import TrackOrder from './pages/TrackOrder';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import BackToTop from './components/BackToTop';
import CheckoutModal from './components/CheckoutModal';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element=<Home /> />
              <Route path="/products" element=<Products /> />
              <Route path="/products/:id" element=<Products /> />
              <Route path="/contact" element=<Contact /> />
              <Route path="/about" element=<About /> />
              <Route path="/track-order" element=<TrackOrder /> />
              <Route path="/login" element=<Login /> />
              <Route path="/profile" element=<Profile /> />
              
              {/* Admin Routes */}
              <Route path="/admin" element=<Navigate to="/admin/dashboard" replace /> />
              <Route path="/admin/login" element=<AdminLogin /> />
              <Route path="/admin/dashboard" element=<AdminDashboard /> />

              {/* Driver Routes */}
              <Route path="/driver" element=<Navigate to="/driver/dashboard" replace /> />
              <Route path="/driver/login" element=<DriverLogin /> />
              <Route path="/driver/dashboard" element=<DriverDashboard /> />
            </Routes>
            <BackToTop />
            <CheckoutModal />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
