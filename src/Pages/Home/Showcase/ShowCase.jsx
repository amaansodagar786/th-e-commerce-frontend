import React from "react";
import "./ShowCase.scss";
import { motion } from "framer-motion";
import rightImage from "../../../assets/images/home/showcase/about-right-image1.png";
import logo1 from "../../../assets/images/home/showcase/logo4.png";
import logo2 from "../../../assets/images/home/showcase/logo5.png";
import logo3 from "../../../assets/images/home/showcase/logo6.png";
import leftTopImage from "../../../assets/images/home/showcase/left-top-image.png";
import nayiImage from "../../../assets/images/home/showcase/teri-image2.png";
import mobileImage from "../../../assets/images/home/showcase/bottle.svg"; // Add your mobile image here

const ShowCase = () => {
  // Heading animation variants
  const headingVariants = {
    hidden: { 
      opacity: 0, 
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Text animation variants
  const textVariants = {
    hidden: { 
      opacity: 0, 
      x: -30
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Stagger container for paragraphs
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const paragraphVariants = {
    hidden: { 
      opacity: 0, 
      x: -30
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Logo items animation variants
  const logoContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4
      }
    }
  };

  const logoItemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    }
  };

  // Left top image animation
  const leftTopVariants = {
    hidden: { 
      opacity: 0, 
      x: -50,
      rotate: -10
    },
    visible: {
      opacity: 1,
      x: 0,
      rotate: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="about-section">
      <div className="about-container">
        {/* Left Side - Text Content */}
        <div className="about-left">
          {/* Left Top Decorative Image with Animation */}
          <motion.div 
            className="left-top-image"
            variants={leftTopVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <img src={leftTopImage} alt="decorative" />
          </motion.div>

          <motion.h2 
            className="about-heading"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            A perfect blend of taste,<br /> aroma,
            purity, and health!
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.p 
              className="about-description"
              variants={paragraphVariants}
            >
              Never compromise with oils blended with impurities or hidden additives. Every drop of Satvsar Oil is produced in our advanced facility, following strict Good Manufacturing Practice (GMP) guidelines and certified by FSSAI.
            </motion.p>

            <motion.p 
              className="about-description second-para"
              variants={paragraphVariants}
            >
              We celebrate authenticity in every bottle, with each batch rigorously quality-checked so that what reaches your kitchen reflects the true richness of India's fertile lands.
            </motion.p>
          </motion.div>

          {/* Three Logo Section with Animation */}
          <motion.div 
            className="three-logos"
            variants={logoContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div 
              className="logo-item"
              variants={logoItemVariants}
              whileHover="hover"
            >
              <img src={logo1} alt="Unrefined & No Chemical" />
              <p>Unrefined & No Chemical</p>
            </motion.div>
            <motion.div 
              className="logo-item"
              variants={logoItemVariants}
              whileHover="hover"
            >
              <img src={logo2} alt="100% Pure & Natural" />
              <p>100% Pure & Natural</p>
            </motion.div>
            <motion.div 
              className="logo-item"
              variants={logoItemVariants}
              whileHover="hover"
            >
              <img src={logo3} alt="No Additives & No Artificial Flavors" />
              <p>No Additives & No Artificial Flavors</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Image - NO ANIMATION */}
        <div className="about-right">
          <img src={rightImage} alt="Satvsar Oil Products" className="right-image" />
        </div>
      </div>

      {/* FULL WIDTH IMAGE - Hidden on mobile, visible on desktop */}
      <div className="full-image-container desktop-only">
        <img src={nayiImage} alt="full width" className="full-image" />
      </div>

      {/* MOBILE ONLY IMAGE */}
      <div className="mobile-image-container mobile-only">
        <img src={mobileImage} alt="Satvsar Oil" className="mobile-image" />
      </div>
    </section>
  );
};

export default ShowCase;