import React, { useState, useEffect } from "react";
import "./Slider.scss";

import img1 from "../../../assets/images/home/slider/slide1.png";
import img2 from "../../../assets/images/home/slider/slide2.png";
import img3 from "../../../assets/images/home/slider/slide3.png";

const Slider = () => {
  const images = [img1, img2, img3];

  const [current, setCurrent] = useState(0);

  // 🔥 Auto slide for mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000); // 3 sec

    return () => clearInterval(interval);
  }, []);

  // Manual dot click handler
  const goToSlide = (index) => {
    setCurrent(index);
  };

  return (
    <section className="frying">

      {/* DESKTOP VIEW */}
      <div className="frying__desktop">
        {images.map((img, index) => (
          <div className="frying__card" key={index}>
            <img src={img} alt="frying" />
          </div>
        ))}
      </div>

      {/* MOBILE VIEW */}
      <div className="frying__mobile">
        <div
          className="frying__track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((img, index) => (
            <div className="frying__slide" key={index}>
              <img src={img} alt="frying" />
            </div>
          ))}
        </div>

        {/* Dots Navigation */}
        <div className="frying__dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`frying__dot ${current === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </section>
  );
};

export default Slider;