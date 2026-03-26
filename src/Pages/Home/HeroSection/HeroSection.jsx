

import React, { useState, useEffect } from "react";
import "./HeroSection.scss";
import heroBgImage from "../../../assets/images/home/hero/hero.png";
import oilJarImage from "../../../assets/images/home/hero/oiljar.png";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section 
      className="hero" 
      style={{ backgroundImage: `url(${heroBgImage})` }}
    >
      <div className="hero__overlay"></div>
      <div className="hero__container">
        <div className="hero__left">
          <h1 className={`hero__main-text ${isVisible ? 'show' : ''}`}>
            {isMobile ? (
              "Pure Oil | Pure Care | Pure Satvsar"
            ) : (
              <>
                Pure Oil.
                <br />
                Pure Care.
                <br />
                Pure Satvsar.
              </>
            )}
          </h1>
        </div>

        <div className="hero__right">
          <img 
            src={oilJarImage} 
            alt="Satvsar Pure Oil" 
            className={`hero__oil-image ${isVisible ? 'show' : ''}`}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;