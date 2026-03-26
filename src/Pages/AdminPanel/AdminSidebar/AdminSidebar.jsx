import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdProductionQuantityLimits,
  MdMenu,
  MdClose,
  MdLocalOffer,
  MdShoppingCart
} from "react-icons/md";
import "./AdminSidebar.scss";

function AdminSidebar() {
  const [open, setOpen] = useState(false); // Changed to false by default on desktop
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Reset states when switching between mobile/desktop
      if (!mobile) {
        setMobileOpen(false);
        setOpen(false); // Keep sidebar collapsed on desktop by default
      } else {
        setOpen(true); // On mobile, sidebar is always in expanded mode internally
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
      {/* Mobile Hamburger Button - Only show on mobile when sidebar is closed */}
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
            // Desktop collapsed view - only menu icon
            <button
              className="toggle-btn collapsed"
              onClick={() => setOpen(true)}
              title="Expand sidebar"
            >
              <MdMenu />
            </button>
          ) : (
            // Expanded view (both desktop expanded and mobile)
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
                {/* Show title when: not collapsed on desktop OR on mobile (always show) */}
                {(!isMobile && !open) ? null : <span className="menu-title">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
      {isMobile && mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

export default AdminSidebar;