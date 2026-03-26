// NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { MdHome, MdArrowBack, MdLocalFireDepartment } from "react-icons/md";
import "./NotFound.scss";

const NotFound = () => {
  const navigate = useNavigate();

  const suggestions = [
    { text: "Go to Homepage", icon: <MdHome />, path: "/" },
    { text: "Check Our Products", icon: <MdLocalFireDepartment />, path: "/products" },
  ];

  return (
    <div className="not-found">
      {/* Animated Oil Drop Background */}
      <div className="not-found__bg-oil">
        <div className="oil-drop oil-drop--1"></div>
        <div className="oil-drop oil-drop--2"></div>
        <div className="oil-drop oil-drop--3"></div>
        <div className="oil-drop oil-drop--4"></div>
      </div>

      <div className="not-found__container">
        {/* Traditional Pattern Top */}
        <div className="not-found__pattern-top">
          <svg width="120" height="20" viewBox="0 0 120 20" fill="none">
            <path d="M10 0L12.5 7H20L14 11.5L16.5 19L10 14L3.5 19L6 11.5L0 7H7.5L10 0Z" fill="#c98b30" opacity="0.6"/>
            <path d="M40 0L42.5 7H50L44 11.5L46.5 19L40 14L33.5 19L36 11.5L30 7H37.5L40 0Z" fill="#c98b30" opacity="0.6"/>
            <path d="M70 0L72.5 7H80L74 11.5L76.5 19L70 14L63.5 19L66 11.5L60 7H67.5L70 0Z" fill="#c98b30" opacity="0.6"/>
            <path d="M100 0L102.5 7H110L104 11.5L106.5 19L100 14L93.5 19L96 11.5L90 7H97.5L100 0Z" fill="#c98b30" opacity="0.6"/>
          </svg>
        </div>

        {/* Main Content */}
        <div className="not-found__content">
          {/* 404 Number with Oil Animation */}
          <div className="not-found__code-wrapper">
            <div className="not-found__oil-kadai">
              <svg viewBox="0 0 200 180" fill="none" className="kadai-svg">
                <path d="M30 80 L170 80 L150 150 L50 150 L30 80Z" fill="#ede8df" stroke="#4e221c" strokeWidth="2"/>
                <path d="M100 30 L100 80" stroke="#c98b30" strokeWidth="3" strokeDasharray="5 5"/>
                <circle cx="100" cy="30" r="8" fill="#c98b30"/>
                <path d="M80 30 L120 30" stroke="#4e221c" strokeWidth="2"/>
                <path d="M85 25 L115 25" stroke="#4e221c" strokeWidth="2"/>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 100 80"
                  to="360 100 80"
                  dur="20s"
                  repeatCount="indefinite"
                />
              </svg>
              <div className="not-found__numbers">
                <span className="digit digit--4">4</span>
                <span className="digit digit--0">0</span>
                <span className="digit digit--4">4</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="not-found__message">
            <h1 className="not-found__title">Page Not Found</h1>
            <div className="not-found__divider">
              <span className="divider-line"></span>
              <span className="divider-icon">🪔</span>
              <span className="divider-line"></span>
            </div>
            <p className="not-found__description">
              Oops! This recipe seems to be missing from our kitchen.
              <br />
              The oil you're looking for might have spilled into another page.
            </p>
          </div>

          {/* Suggestion Cards */}
          <div className="not-found__suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-card"
                onClick={() => navigate(suggestion.path)}
              >
                <span className="suggestion-card__icon">{suggestion.icon}</span>
                <span className="suggestion-card__text">{suggestion.text}</span>
                <span className="suggestion-card__arrow">→</span>
              </button>
            ))}
          </div>

          {/* Back Button */}
          <button className="not-found__back-btn" onClick={() => navigate(-1)}>
            <MdArrowBack />
            <span>Go Back</span>
          </button>

          {/* Help Text - Updated */}
          <p className="not-found__help">
            Need assistance? <a href="/contact">Contact our support</a> — we're here to help!
          </p>
        </div>

        {/* Traditional Pattern Bottom */}
        <div className="not-found__pattern-bottom">
          <svg width="120" height="20" viewBox="0 0 120 20" fill="none">
            <path d="M10 0L12.5 7H20L14 11.5L16.5 19L10 14L3.5 19L6 11.5L0 7H7.5L10 0Z" fill="#c98b30" opacity="0.4"/>
            <path d="M40 0L42.5 7H50L44 11.5L46.5 19L40 14L33.5 19L36 11.5L30 7H37.5L40 0Z" fill="#c98b30" opacity="0.4"/>
            <path d="M70 0L72.5 7H80L74 11.5L76.5 19L70 14L63.5 19L66 11.5L60 7H67.5L70 0Z" fill="#c98b30" opacity="0.4"/>
            <path d="M100 0L102.5 7H110L104 11.5L106.5 19L100 14L93.5 19L96 11.5L90 7H97.5L100 0Z" fill="#c98b30" opacity="0.4"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NotFound;