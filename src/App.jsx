import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";

import "./App.css";
import Home from "./Pages/Home/Home";
import Navbar from "./Components/Navbar/Navbar";
// import Login from "./Components/Login/Login";
// import Register from "./Components/Register/Register";
// import AdminLogin from "./Pages/AdminAuth/AdminLogin/AdminLogin";
// import AdminRegister from "./Pages/AdminAuth/AdminReg/AdminRegister";
import AdminDashboard from "./Pages/AdminPanel/AdminDashboard/AdminDashboard";
import AdminLayout from "./Pages/AdminPanel/AdminLayout/AdminLayout";
import AdminCategories from "./Pages/AdminPanel/Categories/AdminCategories";
import ListProducts from "./Pages/AdminPanel/ListProducts/ListProducts";
import Inventories from "./Pages/AdminPanel/Inventory/Inventories";
import ProductOffers from "./Pages/AdminPanel/ProductOffers/ProductOffers";
import ProductPage from "./Pages/ProductPage/ProductPage";
import Wishlist from "./Pages/Wishlist/Wishlist";
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

// Create a wrapper component to conditionally show Navbar and Footer
function LayoutWrapper({ children }) {
  const location = useLocation();

  // Define routes where Navbar and Footer should be hidden
  const hideNavAndFooterRoutes = ['/login', '/admin/login'];

  // Check if current path matches any hide routes
  const shouldHideNavAndFooter = hideNavAndFooterRoutes.includes(location.pathname);

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
      <Routes>
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
        <Route path="/login" element={<UserAuth />} />
        {/* <Route path="/register" element={<Register />} />  */}
        {/* <Route path="/adminregister" element={<AdminRegister />} /> */}
        {/* <Route path="/adminlogin" element={<AdminLogin />} /> */}
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route path="/product/:productId" element={
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
        <Route path="/my-reviews" element={
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
        <Route
          path="/admin/dashboard"
          element={
            <LayoutWrapper>
              <AdminDashboard />
            </LayoutWrapper>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <LayoutWrapper>
              <AdminCategories />
            </LayoutWrapper>
          }
        />
        <Route
          path="/admin/products"
          element={
            <LayoutWrapper>
              <ListProducts />
            </LayoutWrapper>
          }
        />
        <Route
          path="/admin/inventories"
          element={
            <LayoutWrapper>
              <AdminLayout>
                <Inventories />
              </AdminLayout>
            </LayoutWrapper>
          }
        />
        <Route
          path="/admin/productoffers"
          element={
            <LayoutWrapper>
              <ProductOffers />
            </LayoutWrapper>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <LayoutWrapper>
              <AdminOrders />
            </LayoutWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;