import React from 'react';
import { motion } from 'framer-motion';
import './DistributorHero.scss';
import hero from "../../../assets/images/contact/distributor-hero.jpeg";

const DistributorHero = () => {
  return (
    <motion.div
      className="distributor-hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="distributor-hero__overlay"></div>
      <img
        src={hero}
        alt="Oil manufacturing and distribution"
        className="distributor-hero__image"
      />
      <div className="distributor-hero__content">
        <motion.h1 
          className="distributor-hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Partner With Satvsar.
        </motion.h1>
        <motion.p 
          className="distributor-hero__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Together, let's bring the goodness of pure, healthy oil to every kitchen in India.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default DistributorHero;