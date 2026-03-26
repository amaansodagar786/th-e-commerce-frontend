import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./Navbar.scss";
import logoImage from "../../assets/images/logo/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState("");
  const { pathname } = useLocation();
  const profileRef = useRef(null);
  let hoverTimeout = useRef(null);

  const isActive = (path) => pathname === path;

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const navLinks = [
    { to: "/", label: "HOME" },
    { to: "/contact", label: "CONTACT" },
    { to: "/products", label: "DISTRIBUTORSHIP" }
  ];

  const profileLinks = [
    { to: "/profile", label: "My Profile", icon: "user" },
    { to: "/orders", label: "My Orders", icon: "package" },
    { to: "/reviews", label: "My Reviews", icon: "star" },
    { to: "/logout", label: "Logout", icon: "log-out" }
  ];

  // ✅ Fetch cart count from API
  const fetchCartCount = useCallback(async () => {
    if (!token || !userId) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/count/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  }, [token, userId]);

  // ✅ Fetch user name from API
  const fetchUserName = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/profile/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserName(res.data.name || "");
    } catch (err) {
      console.error("Failed to fetch user name:", err);
    }
  }, [token, userId]);

  useEffect(() => {
    fetchCartCount();
    fetchUserName();

    const handleCartUpdated = () => fetchCartCount();
    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [fetchCartCount, fetchUserName]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsProfileOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 200);
  };

  const handleProfileClick = () => setIsProfileOpen(!isProfileOpen);

  const handleHamburgerChange = (e) => {
    setIsOpen(e.target.checked);
    if (!e.target.checked) setIsProfileOpen(false);
  };

  // ✅ Show first name only, fallback to "User" if not logged in
  const displayName = userName ? userName.split(" ")[0] : "User";

  // Icon components
  const ProfileIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const UserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const PackageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4L7.5 4.2" />
      <path d="M21 16.2V7.8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 7.8v8.4a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16.2z" />
      <polyline points="3.3 7 12 12 20.7 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );

  const StarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const CartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 5H6" />
    </svg>
  );

  const ArrowIcon = ({ isOpen }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isOpen ? 'open' : ''}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'user': return <UserIcon />;
      case 'package': return <PackageIcon />;
      case 'star': return <StarIcon />;
      case 'log-out': return <LogoutIcon />;
      default: return null;
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="desktop-navbar">
        <div className="navbar-container">
          <Link to="/" className="logo">
            <img src={logoImage} alt="Satvsar" className="logo-image" />
          </Link>

          <div className="nav-links">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={isActive(to) ? 'active' : ''}>
                {label}
              </Link>
            ))}
          </div>

          <div className="right-icons">
            <Link to="/cart" className="cart-wrapper">
              <div className="cart-icon-container">
                <CartIcon />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
            </Link>

            <div
              className="profile-wrapper"
              ref={profileRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`profile-icon ${isProfileOpen ? 'active' : ''}`}
                onClick={handleProfileClick}
              >
                <ProfileIcon />
              </div>

              <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
                <div className="dropdown-header">
                  {/* ✅ Real first name here */}
                  <span className="user-greeting">Hi, {displayName}</span>
                </div>
                <div className="dropdown-links">
                  {profileLinks.map(({ to, label, icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="dropdown-link"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span className="dropdown-icon">{getIcon(icon)}</span>
                      <span className="dropdown-label">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className={`mobile-navbar ${isOpen ? 'menu-open' : ''}`}>
        <div className="mobile-navbar-container">
          <Link to="/" className="mobile-logo">
            <img src={logoImage} alt="Satvsar" className="mobile-logo-image" />
          </Link>

          <label className="hamburger">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={handleHamburgerChange}
            />
            <svg viewBox="0 0 32 32">
              <path
                className="line line-top-bottom"
                d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 15.2 30 13 30 10.8 30 9 28.2 9 26 9 23.8 10.8 22 13 22L27 22"
              />
              <path className="line" d="M7 16 27 16" />
            </svg>
          </label>
        </div>

        <div className={`mobile-menu-links ${isOpen ? 'open' : ''}`}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={isActive(to) ? 'active' : ''}
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}

          <Link to="/cart" className="mobile-cart-link" onClick={() => setIsOpen(false)}>
            <div className="mobile-cart-icon-container">
              <CartIcon />
              {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
            </div>
            <span>Cart</span>
          </Link>

          <div className="mobile-profile-section">
            <div className="mobile-profile-header" onClick={handleProfileClick}>
              <ProfileIcon />
              {/* ✅ Real first name on mobile too */}
              <span>Hi, {displayName}</span>
              <ArrowIcon isOpen={isProfileOpen} />
            </div>
            <div className={`mobile-profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
              {profileLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="mobile-profile-link"
                  onClick={() => {
                    setIsOpen(false);
                    setIsProfileOpen(false);
                  }}
                >
                  <span className="mobile-dropdown-icon">{getIcon(icon)}</span>
                  <span className="mobile-dropdown-label">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;