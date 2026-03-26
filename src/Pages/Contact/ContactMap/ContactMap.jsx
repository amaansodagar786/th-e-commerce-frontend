// ContactMap.jsx - Updated with Correct Vadodara Location
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import "./ContactMap.scss";

const ContactMap = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    // Updated map URL for Vadodara location
    const mapUrl = "https://www.google.com/maps/place/G.F.-39,+Infinity+Arcade,+Pratapnagar,+Vadodara,+Gujarat+390004/@22.3001959,73.1863935,17z/data=!3m1!4b1!4m6!3m5!1s0x395fc46c9ab5c9b7:0x7e5c8a5e3c9d2f4!8m2!3d22.300191!4d73.1889684!16s%2Fg%2F11f3j9k5l7?entry=ttu";

    const handleMapClick = () => {
        window.open(mapUrl, "_blank");
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <motion.div
            ref={sectionRef}
            className="contact-map"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
        >
            <div className="contact-map__container">
                <motion.div className="contact-map__header" variants={itemVariants}>
                    <h2 className="contact-map__title">Find Us Here</h2>
                    <div className="contact-map__divider">
                        <span className="divider-line"></span>
                        <span className="divider-icon">📍</span>
                        <span className="divider-line"></span>
                    </div>
                    <p className="contact-map__subtitle">
                        G.F.-39, Infinity Arcade, Near Pratapnagar Bridge, ONGC Road, Pratapnagar, Vadodara - 390004
                    </p>
                </motion.div>

                <motion.div
                    className="contact-map__wrapper"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleMapClick}
                    style={{ cursor: "pointer" }}
                >
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3690.648331394843!2d73.1863935!3d22.3001959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fc46c9ab5c9b7%3A0x7e5c8a5e3c9d2f4!2sG.F.-39%2C%20Infinity%20Arcade%2C%20Pratapnagar%2C%20Vadodara%2C%20Gujarat%20390004!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Satvsar Oil Location - Infinity Arcade, Vadodara"
                        className="contact-map__iframe"
                    ></iframe>
                    <div className="contact-map__overlay">
                        <span>📍 Click to open in Google Maps →</span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ContactMap;