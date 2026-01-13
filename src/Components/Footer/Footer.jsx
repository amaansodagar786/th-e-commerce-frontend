import React from "react";
import "./Footer.scss";
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import logo from "./logo.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__top">

        {/* LEFT LOGO */}
        <div className="footer__logo">
          <img src={logo} alt="By Mythology" />
          <div className="footer__icons">
            <FaInstagram />
            <FaFacebookF />
            <FaLinkedinIn />
            <FaYoutube />
          </div>
        </div>

        {/* COMPANY */}
        <div className="footer__col">
          <h4>COMPANY</h4>
          <ul>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
            <li>Coming Soon</li>
          </ul>
        </div>

        {/* SERIES */}
        <div className="footer__col">
          <h4>SERIES</h4>
          <ul>
            <li>Ramayan</li>
            <li>Swaminarayan</li>
            <li>Krishna Lila</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer__col">
          <h4>CONTACT</h4>
          <p>+91 1233456781</p>
          <p>bymythology@gmail.com</p>
          <p>
            41, Luna Rd, Taluko: Padra,<br />
            District: Vadodara-391440,<br />
            Gujarat.
          </p>
        </div>

        {/* 🔥 COPYRIGHT — SAME ROW KE NICHE */}
        <div className="footer__bottom">
          Copyright © 2025 Candle, All Rights Reserved.
          <span> Design and Developed by <b>TECHORSES</b></span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
