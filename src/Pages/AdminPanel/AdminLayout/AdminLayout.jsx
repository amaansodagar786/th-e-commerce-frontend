import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminLayout.scss";
import AdminSidebar from "../AdminSidebar/AdminSidebar";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("role");

  useEffect(() => {
    // Check if admin is logged in
    if (!adminToken) {
      toast.error("Please login to access admin panel", {
        position: "top-right",
        autoClose: 2000,
      });
      navigate("/admin/login");
      return;
    }

    // Check if role is admin (not user)
    if (adminRole !== "admin") {
      toast.error("Access denied. Admin privileges required.", {
        position: "top-right",
        autoClose: 2000,
      });
      navigate("/");
      return;
    }
  }, [adminToken, adminRole, navigate]);

  // Don't render anything while checking or if not authenticated
  if (!adminToken || adminRole !== "admin") {
    return null; // or return a loading spinner
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}

export default AdminLayout;