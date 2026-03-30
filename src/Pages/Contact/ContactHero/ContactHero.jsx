// ContactHero.jsx
import React from "react";
import { motion } from "framer-motion";
import "./ContactHero.scss";
import hero from "../../../assets/images/contact/contacthero.png" ;

const ContactHero = () => {
  return (
    <motion.div
      className="contact-hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img
        src={hero}
        alt="Traditional Indian kitchen with cooking oil"
        className="contact-hero__image"
      />
    </motion.div>
  );
};

export default ContactHero;