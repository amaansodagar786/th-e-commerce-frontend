import React from "react";
import "./Footer.scss";
import { motion } from "framer-motion";
import logo from "../../assets/images/home/footer/logo3.png";
import peanut from "../../assets/images/home/footer/left-side-image.png";
import peanutMobile from "../../assets/images/home/footer/peanut-mobile.png";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaAmazon, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Animation for contact items
  const contactVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      x: 5,
      color: "#d4a373",
      transition: { duration: 0.3 },
    },
  };

  // Animation for contact icons
  const iconVariants = {
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: { duration: 0.3 },
    },
  };

  // NEW: Subtle Bounce + Heartbeat Animation
  const peanutVariants = {
    animate: {
      scale: [1, 1.02, 1],
      y: [0, -3, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    hover: {
      scale: 1.08,
      y: -5,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    hover: {
      scale: 1.1,
      rotate: 360,
      transition: { duration: 0.3 },
    },
  };

  const shimmerVariants = {
    animate: {
      x: ["-100%", "100%"],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Social media links
  const socialLinks = {
    facebook: "https://www.facebook.com/satvsar",
    twitter: "https://twitter.com/satvsar",
    instagram: "https://www.instagram.com/satvsar",
    linkedin: "https://www.linkedin.com/company/satvsar"
  };

  return (
    <>

      <footer className="footer">
        <motion.div
          className="shimmer-effect"
          variants={shimmerVariants}
          animate="animate"
        />

        <motion.div
          className="footer-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Desktop View */}
          <div className="footer-desktop">
            <motion.div className="footer-middle" variants={itemVariants}>
              <img src={logo} alt="logo" className="footer-logo" />
              <motion.p
                className="tagline"
                whileHover={{ x: 5, color: "#d4a373" }}
              >
                Don't Blame the Chef,<br /> Change the Oil!
              </motion.p>
              <motion.img
                src={peanut}
                alt="mascot"
                className="peanut-img"
                variants={peanutVariants}
                animate="animate"
                whileHover="hover"
              />
            </motion.div>

            <motion.div className="menu" variants={itemVariants}>
              <motion.h4 whileHover={{ scale: 1.05, color: "#d4a373" }}>
                Menu
              </motion.h4>
              <motion.a href="/" whileHover={{ x: 10, color: "#d4a373" }}>
                Home
              </motion.a>
              <motion.a href="/contact" whileHover={{ x: 10, color: "#d4a373" }}>
                Contact
              </motion.a>
              <motion.a
                href="/distributorship"
                whileHover={{ x: 10, color: "#d4a373" }}
              >
                Distributorship
              </motion.a>
            </motion.div>

            {/* CONTACT SECTION WITH FRAMER MOTION */}
            <motion.div className="footer-right" variants={itemVariants}>
              <motion.div 
                className="contact-item"
                variants={contactVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <motion.div variants={iconVariants} whileHover="hover">
                  <FiPhone className="icon" />
                </motion.div>
                <div className="phone-numbers">
                  <motion.a 
                    href="tel:+919274778081"
                    className="phone-link"
                    whileHover={{ x: 3, color: "#d4a373" }}
                  >
                    +91 92747 78081
                  </motion.a>
                  <span className="separator">/</span>
                  <motion.a 
                    href="tel:+917861078081"
                    className="phone-link"
                    whileHover={{ x: 3, color: "#d4a373" }}
                  >
                    +91 78610 78081
                  </motion.a>
                </div>
              </motion.div>
              
              <motion.a 
                href="mailto:info@satvsar.com"
                className="contact-item"
                variants={contactVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <motion.div variants={iconVariants} whileHover="hover">
                  <FiMail className="icon" />
                </motion.div>
                <p>info@satvsar.com</p>
              </motion.a>
              
              <motion.a 
                href="https://maps.google.com/?q=G.F-39,InfinityArcade,NearPratapnagarBridge,ONGCRoad,Pratapnagar,Vadodara-390004,Gujarat"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-item"
                variants={contactVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <motion.div variants={iconVariants} whileHover="hover">
                  <FiMapPin className="icon" />
                </motion.div>
                <p>
                  G.F - 39, Infinity Arcade, Near Pratapnagar Bridge,
                  ONGC Road, Pratapnagar, Vadodara-390004. Gujarat (India)
                </p>
              </motion.a>
            </motion.div>
          </div>

          {/* Mobile View */}
          <div className="footer-mobile">
            <div className="footer-mobile-left">
              <img src={logo} alt="logo" className="mobile-logo" />
              <p className="mobile-tagline">
                Don't Blame the Chef,<br /> Change the Oil!
              </p>
              <div className="mobile-contact">
                <div className="contact-item">
                  <FiPhone className="icon" />
                  <div className="contact-numbers">
                    <a href="tel:+919274778081" className="contact-link">+91 92747 78081</a>
                    <a href="tel:+917861078081" className="contact-link">+91 78610 78081</a>
                  </div>
                </div>
                <a href="mailto:info@satvsar.com" className="contact-item">
                  <FiMail className="icon" />
                  <p>info@satvsar.com</p>
                </a>
                <a 
                  href="https://maps.google.com/?q=G.F-39,InfinityArcade,NearPratapnagarBridge,ONGCRoad,Pratapnagar,Vadodara-390004,Gujarat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-item"
                >
                  <FiMapPin className="icon" />
                  <p>
                    G.F - 39, Infinity Arcade, Near Pratapnagar Bridge,
                    ONGC Road, Pratapnagar, Vadodara-390004. Gujarat (India)
                  </p>
                </a>
              </div>
            </div>
            <div className="footer-mobile-right">
              <motion.img 
                src={peanutMobile} 
                alt="mascot" 
                className="mobile-peanut"
                variants={peanutVariants}
                animate="animate"
                whileHover="hover"
              />
            </div>
          </div>
        </motion.div>

        <motion.div className="footer-bottom" variants={itemVariants}>
          <div className="footer-bottom-content">
            <p className="copyright-text desktop-only">
              Copyright © 2025 Satvsar, All Rights Reserved. Design and Developed by TECHORSES
            </p>
            <div className="mobile-only">
              <p className="copyright-text-mobile">
                Copyright © 2025 Satvsar, All Rights Reserved.
              </p>
              <p className="developed-text-mobile">
                Design and Developed by TECHORSES
              </p>
            </div>
            <div className="social-icons">
              <motion.a 
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                variants={pulseVariants} 
                animate="animate" 
                whileHover="hover"
              >
                <FaFacebookF />
              </motion.a>
              <motion.a 
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                variants={pulseVariants} 
                animate="animate" 
                whileHover="hover"
              >
                <FaAmazon />
              </motion.a>
              <motion.a 
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                variants={pulseVariants} 
                animate="animate" 
                whileHover="hover"
              >
                <FaInstagram />
              </motion.a>
              <motion.a 
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                variants={pulseVariants} 
                animate="animate" 
                whileHover="hover"
              >
                <FaWhatsapp />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </footer>
    </>
  );
};

export default Footer;