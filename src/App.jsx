import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import Home from "./Pages/Home/Home";
import Navbar from "./Components/Navbar/Navbar";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import AdminLogin from "./Pages/AdminAuth/AdminLogin/AdminLogin";
import AdminRegister from "./Pages/AdminAuth/AdminReg/AdminRegister";
import AdminDashboard from "./Pages/AdminPanel/AdminDashboard/AdminDashboard";
import AdminLayout from "./Pages/AdminPanel/AdminLayout/AdminLayout";
import AdminCategories from "./Pages/AdminPanel/Categories/AdminCategories";
import ListProducts from "./Pages/AdminPanel/ListProducts/ListProducts";
import Inventories from "./Pages/AdminPanel/Inventory/Inventories";
import ProductOffers from "./Pages/AdminPanel/ProductOffers/ProductOffers";
import ProductPage from "./Pages/ProductPage/ProductPage";
import NotFound from "./Pages/NoPage/NotFound";
import Wishlist from "./Pages/Wishlist/Wishlist";
import Profile from "./Pages/Profile/Profile/Profile";
import Checkout from "./Pages/CheckOut/Checkout";
import UserOrders from "./Pages/Profile/UserOrders/UserOrders";
import AdminOrders from "./Pages/AdminPanel/AdminOrders/AdminOrders";
import UserReviews from "./Pages/Profile/UserReviews/UserReviews";
import AllProducts from "./Pages/AllProducts/AllProducts";
import CategoryProducts from "./Pages/CategoryProducts/CategoryProducts";
import Footer from "./Components/Footer/Footer";

function App() {

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminregister" element={<AdminRegister />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="*" element={<NotFound />} /> {/* */}
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<UserOrders />} />
        <Route path="/my-reviews" element={<UserReviews />} />
        <Route path="/products" element={<AllProducts />} />

        <Route path="/category/:categoryId" element={<CategoryProducts />} />


        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <AdminLayout>
              <AdminCategories />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminLayout>
              <ListProducts />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/inventories"
          element={
            <AdminLayout>
              <Inventories />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/productoffers"
          element={
            <AdminLayout>
              <ProductOffers />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          }
        />
        

      </Routes>
      <Footer/>
    </Router>
  );
}

export default App;
