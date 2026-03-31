import React from "react";
import { motion } from "framer-motion";
import "./ContactHero.scss";
import hero from "../../../assets/images/contact/contacthero.png";

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
      <div className="contact-hero__overlay">
        <motion.h1 
          className="contact-hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Get in Touch
        </motion.h1>
        <motion.p 
          className="contact-hero__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Your journey to healthier cooking starts with a conversation - reach out today
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ContactHero;