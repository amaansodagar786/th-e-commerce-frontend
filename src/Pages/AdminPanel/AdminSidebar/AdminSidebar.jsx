import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdProductionQuantityLimits,
  MdMenu,
  MdClose,
  MdLocalOffer,
  MdShoppingCart,
  MdLogout
} from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminSidebar.scss";

function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-collapse sidebar on every route change (desktop only)
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle Logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    
    // Show success toast
    toast.success("Logged out successfully!", {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
    });
    
    // Redirect to admin login page after a short delay
    setTimeout(() => {
      navigate("/admin/login");
    }, 1500);
  };

  const menuItems = [
    {
      icon: <MdDashboard />,
      title: "Dashboard",
      path: "/admin/dashboard"
    },
    {
      icon: <MdProductionQuantityLimits />,
      title: "List Products",
      path: "/admin/products"
    },
    {
      icon: <MdShoppingCart />,
      title: "Manage Orders",
      path: "/admin/orders"
    },
    {
      icon: <MdCategory />,
      title: "Categories",
      path: "/admin/categories"
    },
    {
      icon: <MdInventory />,
      title: "Inventories",
      path: "/admin/inventories"
    },
    {
      icon: <MdLocalOffer />,
      title: "Product Offers",
      path: "/admin/productoffers"
    }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && !mobileOpen && (
        <button
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <MdMenu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${!isMobile && !open ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Logo/Toggle Area */}
        <div className="sidebar-header">
          {(!isMobile && !open) ? (
            <button
              className="toggle-btn collapsed"
              onClick={() => setOpen(true)}
              title="Expand sidebar"
            >
              <MdMenu />
            </button>
          ) : (
            <div className="logo-area">
              <h2 className="logo-text">Admin Panel</h2>
              <button
                className="toggle-btn"
                onClick={toggleSidebar}
                title={isMobile ? "Close menu" : "Collapse sidebar"}
              >
                <MdClose />
              </button>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li key={index} onClick={closeMobileSidebar}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "menu-link active" : "menu-link"
                }
              >
                <span className="menu-icon">{item.icon}</span>
                {(!isMobile && !open) ? null : <span className="menu-title">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout Button - Bottom Section */}
        <div className="sidebar-footer">
          <button
            className={`logout-btn ${(!isMobile && !open) ? "collapsed" : ""}`}
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon">
              <MdLogout />
            </span>
            {(!isMobile && !open) ? null : <span className="logout-text">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Toast Container for logout messages */}
      <ToastContainer />
    </>
  );
}

export default AdminSidebar;