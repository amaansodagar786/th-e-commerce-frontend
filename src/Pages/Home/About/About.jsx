import React from "react";
import "./About.scss";
import { motion } from "framer-motion";
import healthImage from "../../../assets/images/home/about/about.png";

const About = () => {
  // Text animation variants
  const textVariants = {
    hidden: { 
      opacity: 0, 
      x: 50
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // SIMPLE IMAGE ANIMATION - Fade In + Scale
  const imageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };

  // Circle animation variants
  const circleVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.5,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.4
      }
    },
    hover: {
      scale: 1.05,
      backgroundColor: "#8b3e2e",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.95
    }
  };

  // Stagger children for paragraphs
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
      x: 30
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

  return (
    <section className="health-section">
      <div className="health-section__container">
        {/* Left Side - Image with Yellow Circle Behind */}
        <motion.div 
          className="health-section__left"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="health-section__image-box">
            <motion.div
              className="health-section__circle"
              variants={circleVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            />
            <motion.img
              src={healthImage}
              alt="Satvsar Oil"
              className="health-section__image"
              variants={imageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
            />
          </div>
        </motion.div>

        {/* Right Side - Text and Button */}
        <motion.div 
          className="health-section__right"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p 
            className="health-section__text"
            variants={paragraphVariants}
          >
            Health doesn't begin at the gym or in medicines - it begins in your kitchen. The ingredients you choose every day quietly shape your family's future.
          </motion.p>

          <motion.p 
            className="health-section__text"
            variants={paragraphVariants}
          >
            Cooking oil is a foundation of Indian cooking. From morning breakfasts to festive meals, it touches almost every dish. Studies show that the purity of oil plays a vital role in maintaining long-term health and energy.
          </motion.p>

          <motion.p 
            className="health-section__text"
            variants={paragraphVariants}
          >
            <strong>Satvsar Oil</strong> is crafted with a promise of natural purity and uncompromised quality. It retains essential nutrients, enhances the authentic taste of food, and supports a healthier lifestyle for your loved ones.
          </motion.p>

          <motion.p 
            className="health-section__text"
            variants={paragraphVariants}
          >
            Small choices create big impact. Switch to <strong>Satvsar Oil</strong> and cook with confidence.
          </motion.p>

          <motion.button 
            className="health-section__button"
            variants={buttonVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover="hover"
            whileTap="tap"
          >
            BUY NOW
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default About;