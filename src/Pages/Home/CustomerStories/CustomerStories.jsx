import React from "react";
import "./CustomerStories.scss";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { FaQuoteLeft, FaQuoteRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";

const reviews = [
    {
        id: 1,
        videoSrc: "https://www.w3schools.com/html/mov_bbb.mp4",  // Big Buck Bunny
    },
    {
        id: 2,
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
        id: 3,
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
        id: 4,
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
        id: 5,
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
        id: 6,
        videoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
];

// ── Framer Motion variants ──────────────────────────────────────────
const quoteLetterVariants = {
    rest: { y: 0, color: "#4e271f" },
    hover: (i) => ({
        y: [0, -8, 0],
        color: ["#4e271f", "#c0622b", "#4e271f"],
        transition: {
            delay: i * 0.04,
            duration: 0.5,
            ease: "easeInOut",
        },
    }),
};

const underlineVariants = {
    rest: { scaleX: 0, originX: 0 },
    hover: {
        scaleX: 1,
        transition: { duration: 0.35, ease: "easeOut" },
    },
};

const descVariants = {
    rest: { opacity: 0.75, letterSpacing: "0em" },
    hover: {
        opacity: 1,
        letterSpacing: "0.03em",
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

const quoteIconVariants = {
    rest: { scale: 1, rotate: 0, color: "#c0622b" },
    hover: {
        scale: 1.3,
        rotate: [0, -15, 15, 0],
        color: "#4e271f",
        transition: { duration: 0.5, ease: "easeInOut" },
    },
};

// ── Split text into animated span letters ──────────────────────────
const AnimatedText = ({ text, className }) => {
    return (
        <span className={className}>
            {text.split("").map((char, i) =>
                char === " " ? (
                    <span key={i}>&nbsp;</span>
                ) : (
                    <motion.span
                        key={i}
                        custom={i}
                        variants={quoteLetterVariants}
                        style={{ display: "inline-block" }}
                    >
                        {char}
                    </motion.span>
                )
            )}
        </span>
    );
};

// ── Main Component ─────────────────────────────────────────────────
const CustomerStories = () => {
    return (
        <section className="customer-stories">
            <div className="stories-container">
                <h2 className="stories-heading">Customer Stories</h2>

                {/* ── Swiper Slider ── */}
                <div className="stories-swiper-wrapper">
                    <Swiper
                        modules={[Navigation]}
                        navigation={{
                            prevEl: ".cs-btn-prev",
                            nextEl: ".cs-btn-next",
                        }}
                        loop={true}
                        speed={600}
                        breakpoints={{
                            0: { slidesPerView: 2, spaceBetween: 16 },
                            601: { slidesPerView: 3, spaceBetween: 20 },
                            1025: { slidesPerView: 4, spaceBetween: 28 },
                        }}
                        className="cs-swiper"
                    >
                        {reviews.map((review) => (
                            <SwiperSlide key={review.id}>
                                <div className="story-card">
                                    <div className="card-video-wrap">
                                        <video
                                            src={review.videoSrc}
                                            className="card-video"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom nav buttons */}
                    <div className="scroll-buttons">
                        <button className="cs-btn-prev" aria-label="Previous">
                            <FaArrowLeftLong />
                        </button>
                        <button className="cs-btn-next" aria-label="Next">
                            <FaArrowRightLong />
                        </button>
                    </div>
                </div>

                {/* ── Text Section with Framer Motion hover ── */}
                <motion.div
                    className="stories-content"
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                >
                    <div className="quote-text">
                        <motion.span className="quote-icon quote-icon--left" variants={quoteIconVariants}>
                            <FaQuoteLeft />
                        </motion.span>

                        <span className="quote-words">
                            <AnimatedText text="FROM " className="word-normal" />
                            <AnimatedText text="OUR" className="word-bold" />
                            <AnimatedText text=" KITCHEN " className="word-normal" />
                            <AnimatedText text="TO" className="word-bold" />
                            <AnimatedText text=" YOURS." className="word-normal" />
                        </span>

                        <motion.span className="quote-icon quote-icon--right" variants={quoteIconVariants}>
                            <FaQuoteRight />
                        </motion.span>
                    </div>

                    <motion.div className="quote-underline" variants={underlineVariants} />

                    <motion.p className="stories-description" variants={descVariants}>
                        Loved by thousands of families who cook healthier every day with Satvsar Oil.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};

export default CustomerStories;