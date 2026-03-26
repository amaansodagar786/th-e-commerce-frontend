// ContactHero.jsx
import React from "react";
import { motion } from "framer-motion";
import "./ContactHero.scss";

const ContactHero = () => {
  return (
    <motion.div
      className="contact-hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img
        src="https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        alt="Traditional Indian kitchen with cooking oil"
        className="contact-hero__image"
      />
    </motion.div>
  );
};

export default ContactHero;