import React from "react";

const Footer = () => {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#000",
        color: "#fff",
        paddingTop: "90px",
        position: "relative"
      }}
    >

      <div className="footer-grid">
        {/* LOGO */}
        <div>
          <div className="logo-circle">ॐ</div>
          <div className="socials">
            <div className="social-icon">IG</div>
            <div className="social-icon">F</div>
            <div className="social-icon">IN</div>
            <div className="social-icon">YT</div>
          </div>
        </div>

        {/* COMPANY */}
        <div>
          <div className="heading">COMPANY</div>
          <div className="text">Home</div>
          <div className="text">About</div>
          <div className="text">Contact</div>
          <div className="text">Coming Soon</div>
        </div>

        {/* SERIES */}
        <div>
          <div className="heading">SERIES</div>
          <div className="text">Ramayan</div>
          <div className="text">Swaminarayan</div>
          <div className="text">Krishna Lila</div>
        </div>

        {/* CONTACT */}
        <div>
          <div className="heading">CONTACT</div>
          <div className="text">+91 1233456781</div>
          <div className="text">bymythology@gmail.com</div>
          <div className="text">
            41, Luna Rd, Taluko: Padra,<br />
            District: Vadodara-391440,<br />
            Gujarat.
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        Copyright © 2025 Candle, All Rights Reserved. Design and Developed by{" "}
        <strong>TECHORSES</strong>
      </div>
    </div>
  );
};

export default Footer;
