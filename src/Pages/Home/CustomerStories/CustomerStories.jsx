import React from "react";
import "./CustomerStories.scss";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { FaQuoteLeft, FaQuoteRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";

// Helper function to extract YouTube video ID from any YouTube URL
const getYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([^\/\?&]+)/,  // YouTube Shorts
    /(?:youtube\.com\/watch\?v=)([^\/\?&]+)/, // Regular YouTube
    /(?:youtu\.be\/)([^\/\?&]+)/,             // youtu.be
    /(?:youtube\.com\/embed\/)([^\/\?&]+)/    // embed format
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const reviews = [
    {
        id: 1,
        videoUrl: "https://youtube.com/shorts/wbE9qQKMP7E?si=sQnvDHk4xjLeq5kn",
        title: "VALENTINE SPECIAL",
        subtitle: "Love in Every Drop"
    },
    {
        id: 2,
        videoUrl: "https://youtube.com/shorts/o3AHdNjRdxU?si=X8YIW8G_f-ovdi-z",
        title: "FAMILY FAVORITE",
        subtitle: "Healthy Cooking Made Easy"
    },
    {
        id: 3,
        videoUrl: "https://youtube.com/shorts/OpQFXSHbD7I?si=bLzDeRIdlkETlcJw",
        // isMp4: true,
        title: "NATURE'S BEST",
        subtitle: "100% Pure & Natural"
    },
    {
        id: 4,
        videoUrl: "https://youtube.com/shorts/ulP5CrNwLmY?si=TZtB79GU7S68JkFv",
        // isMp4: true,
        title: "TRADITIONAL TASTE",
        subtitle: "Since 1985"
    },
    {
        id: 5,
        videoUrl: "https://youtube.com/shorts/3VOxXQN9H8U?si=38hdSOYXbCgIm9MA",
        title: "CHEF CHOICE",
        subtitle: "Trusted by Professionals"
    },
    {
        id: 6,
        videoUrl: "https://youtube.com/shorts/cAh_6aN4bd8?si=7jOlPZG73Z05eYVq",
        // isMp4: true,
        title: "EVERYDAY HEALTH",
        subtitle: "Your Family Deserves Best"
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

// ── Video Component with NO interactions, NO controls, infinite play ──
const VideoCard = ({ videoUrl, isMp4, title, subtitle }) => {
    const videoId = !isMp4 ? getYouTubeId(videoUrl) : null;
    const isYouTube = !isMp4 && videoId;

    return (
        <div className="story-card">
            <div className="card-video-wrap">
                {isYouTube ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&color=white&autohide=1&playsinline=1`}
                        className="card-video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title=""
                        style={{ pointerEvents: 'none' }}
                    />
                ) : (
                    <video
                        src={videoUrl}
                        className="card-video"
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                        disablePictureInPicture
                        controlsList="nodownload nofullscreen noremoteplayback"
                    />
                )}
                
                {/* ── TEXT OVERLAY AT BOTTOM ── */}
                <div className="video-text-overlay">
                    <div className="overlay-gradient"></div>
                    <div className="text-content">
                        <h3 className="video-title">{title}</h3>
                        <p className="video-subtitle">{subtitle}</p>
                    </div>
                </div>
            </div>
        </div>
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
                                <VideoCard 
                                    videoUrl={review.videoUrl} 
                                    isMp4={review.isMp4 || false}
                                    title={review.title}
                                    subtitle={review.subtitle}
                                />
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