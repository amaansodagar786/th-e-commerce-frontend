import React from "react";
import { motion } from "framer-motion";
import topPattern from "../../../assets/images/home/footer/top-pattern.png";
import "./FooterTopPattern.scss";

const FooterTopPattern = ({ bgColor = "transparent" }) => {
  return (
    <motion.div 
      className="footer-top-pattern"
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <img src={topPattern} alt="footer pattern decoration" />
    </motion.div>
  );
};

export default FooterTopPattern;