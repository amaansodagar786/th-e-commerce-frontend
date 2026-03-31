import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import "./ContactMap.scss";

const ContactMap = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    // ✅ Clean working Google Maps URL (same like your distributor one)
    const mapUrl =
        "https://maps.google.com/?q=Infinity+Arcade+Pratapnagar+Vadodara";

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
                {/* Header */}
                <motion.div className="contact-map__header" variants={itemVariants}>
                    <h2 className="contact-map__title">Find Us Here</h2>

                    <div className="contact-map__divider">
                        <span className="divider-line"></span>
                        <span className="divider-icon">📍</span>
                        <span className="divider-line"></span>
                    </div>

                    <p className="contact-map__subtitle">
                        G.F.-39, Infinity Arcade, Near Pratapnagar Bridge, ONGC Road,
                        Pratapnagar, Vadodara - 390004
                    </p>
                </motion.div>

                {/* Map */}
                <motion.div
                    className="contact-map__wrapper"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleMapClick}
                    style={{ cursor: "pointer", position: "relative" }}
                >
                    {/* ✅ IMPORTANT FIX: pointerEvents NONE */}
                    <iframe
                        src="https://www.google.com/maps?q=Infinity+Arcade+Pratapnagar+Vadodara&z=17&output=embed"
                        width="100%"
                        height="450"
                        style={{ border: 0, pointerEvents: "none" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Infinity Arcade, Vadodara Location"
                        className="contact-map__iframe"
                    ></iframe>

                    {/* Overlay */}
                    <div className="contact-map__overlay">
                        <span>📍 Click to open in Google Maps →</span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ContactMap;