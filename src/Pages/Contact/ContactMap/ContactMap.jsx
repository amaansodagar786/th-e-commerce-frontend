// ContactMap.jsx
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import "./ContactMap.scss";

const ContactMap = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const mapUrl = "https://www.google.com/maps/place/Jaipur,+Rajasthan/@26.8851413,75.6087256,10z/data=!3m1!4b1!4m6!3m5!1s0x396c4adf4c57e281:0xce1c63a0cf22e09!8m2!3d26.9124336!4d75.7872709!16zL20vMDFrX3Y?entry=ttu";

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
                        Visit our manufacturing facility and experience the purity firsthand
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
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227822.8055260249!2d75.6087256444527!3d26.88514132277388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Satvsar Oil Location"
                        className="contact-map__iframe"
                    ></iframe>
                    <div className="contact-map__overlay">
                        <span>Click to open in Google Maps →</span>
                    </div>
                </motion.div>

               
            </div>
        </motion.div>
    );
};

export default ContactMap;