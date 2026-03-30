// DistributorHero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './DistributorHero.scss';

const DistributorHero = () => {
  const handleCtaClick = () => {
    // Will add form scroll or modal later
    console.log('CTA Clicked - Will open distributor form');
  };

  return (
    <motion.div
      className="distributor-hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="distributor-hero__overlay"></div>
      <img
        src="https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        alt="Oil manufacturing and distribution"
        className="distributor-hero__image"
      />
      <div className="distributor-hero__content">
        <h1 className="distributor-hero__title">
          Partner With <span>Satvsar</span>
        </h1>
        {/* <p className="distributor-hero__subtitle">
          Partner with India's most trusted pure oil brand. 
          Join our growing family of distributors and bring quality to every kitchen.
        </p> */}
        <button className="distributor-hero__btn" onClick={handleCtaClick}>
          Apply Now
        </button>
      </div>
    </motion.div>
  );
};

export default DistributorHero;