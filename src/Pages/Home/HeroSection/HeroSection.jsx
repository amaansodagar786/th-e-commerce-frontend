import React from "react";
import "./HeroSection.scss";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Hero Image
import heroImage from "./images/hero.png";

const HeroSection = () => {
  return (
    <section className="hero-section">
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="hero-swiper"
      >
        <SwiperSlide>
          <div
            className="hero-slide"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </SwiperSlide>

        <SwiperSlide>
          <div
            className="hero-slide"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </SwiperSlide>
      </Swiper>
    </section>
  );
};

export default HeroSection;
