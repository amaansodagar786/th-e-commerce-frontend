import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

function ProtectedRoute({ children, requiredRole }) {
  // Check if admin is logged in
  const adminToken = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("role");

  // If no token, redirect to admin login
  if (!adminToken) {
    toast.error("Please login to access admin panel", {
      position: "top-right",
      autoClose: 2000,
    });
    return <Navigate to="/admin/login" replace />;
  }

  // If role check is required and doesn't match
  if (requiredRole && adminRole !== requiredRole) {
    toast.error("Access denied. Admin privileges required.", {
      position: "top-right",
      autoClose: 2000,
    });
    return <Navigate to="/" replace />;
  }

  // If everything is fine, render the children
  return children;
}

export default ProtectedRoute;