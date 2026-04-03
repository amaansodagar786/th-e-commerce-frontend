import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";

import "./App.css";
import Home from "./Pages/Home/Home";
import Navbar from "./Components/Navbar/Navbar";
import AdminDashboard from "./Pages/AdminPanel/AdminDashboard/AdminDashboard";
import AdminLayout from "./Pages/AdminPanel/AdminLayout/AdminLayout";
import AdminCategories from "./Pages/AdminPanel/Categories/AdminCategories";
import ListProducts from "./Pages/AdminPanel/ListProducts/ListProducts";
import Inventories from "./Pages/AdminPanel/Inventory/Inventories";
import ProductOffers from "./Pages/AdminPanel/ProductOffers/ProductOffers";
import ProductPage from "./Pages/ProductPage/ProductPage";
import Profile from "./Pages/Profile/Profile/Profile";
import Checkout from "./Pages/CheckOut/Checkout";
import UserOrders from "./Pages/Profile/UserOrders/UserOrders";
import AdminOrders from "./Pages/AdminPanel/AdminOrders/AdminOrders";
import UserReviews from "./Pages/Profile/UserReviews/UserReviews";
import AllProducts from "./Pages/AllProducts/AllProducts";
import CategoryProducts from "./Pages/CategoryProducts/CategoryProducts";
import Footer from "./Components/Footer/Footer";
import NewWishlist from "./Pages/Wishlist/NewWishlist";
import AdminAuth from "./Pages/AdminAuth/AdminAuth";
import UserAuth from "./Components/Userauth/Userauth";
import NotFound from "./Pages/404/NotFound";
import Contact from "./Pages/Contact/Contact";
import ScrollToTop from "./Components/GoToTop/ScrollToTop";
import Cart from "./Pages/Cart/Cart";
import Distributorship from "./Pages/Distributorship/Distributorship";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute"; // 👈 IMPORT THIS

function LayoutWrapper({ children }) {
  const location = useLocation();

  // Hide Navbar & Footer for ALL admin routes + login
  const shouldHideNavAndFooter =
    location.pathname.startsWith('/admin') || location.pathname === '/login';

  return (
    <>
      {!shouldHideNavAndFooter && <Navbar />}
      {children}
      {!shouldHideNavAndFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <LayoutWrapper>
            <Home />
          </LayoutWrapper>
        } />
        <Route path="/contact" element={
          <LayoutWrapper>
            <Contact />
          </LayoutWrapper>
        } />
        <Route path="/distributorship" element={
          <LayoutWrapper>
            <Distributorship />
          </LayoutWrapper>
        } />
        <Route path="/login" element={<UserAuth />} />
        <Route path="/admin/login" element={<AdminAuth />} />
        
        <Route path="/product/:slug" element={
          <LayoutWrapper>
            <ProductPage />
          </LayoutWrapper>
        } />
        
        <Route path="*" element={
          <LayoutWrapper>
            <NotFound />
          </LayoutWrapper>
        } />
        
        <Route path="/wishlist" element={
          <LayoutWrapper>
            <NewWishlist />
          </LayoutWrapper>
        } />
        
        <Route path="/profile" element={
          <LayoutWrapper>
            <Profile />
          </LayoutWrapper>
        } />
        
        <Route path="/cart" element={
          <LayoutWrapper>
            <Cart />
          </LayoutWrapper>
        } />
        
        <Route path="/checkout" element={
          <LayoutWrapper>
            <Checkout />
          </LayoutWrapper>
        } />
        
        <Route path="/orders" element={
          <LayoutWrapper>
            <UserOrders />
          </LayoutWrapper>
        } />
        
        <Route path="/reviews" element={
          <LayoutWrapper>
            <UserReviews />
          </LayoutWrapper>
        } />
        
        <Route path="/products" element={
          <LayoutWrapper>
            <AllProducts />
          </LayoutWrapper>
        } />
        
        <Route path="/category/:categoryId" element={
          <LayoutWrapper>
            <CategoryProducts />
          </LayoutWrapper>
        } />

        {/* ========== PROTECTED ADMIN ROUTES ========== */}
        {/* Wrap each admin route with ProtectedRoute */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <AdminDashboard />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/categories" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <AdminCategories />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <ListProducts />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/inventories" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <AdminLayout>
                  <Inventories />
                </AdminLayout>
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/productoffers" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <ProductOffers />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/orders" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <AdminOrders />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;