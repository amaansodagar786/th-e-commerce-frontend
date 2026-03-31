// ContactForm.jsx - Updated with API Integration
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdMessage,
    MdSend,
    MdLocationOn,
    MdPhoneInTalk,
    MdEmail as MdEmailIcon,
} from "react-icons/md";
import {
    FaInstagram,
    FaFacebookF,
    FaWhatsapp,
    FaAmazon,
} from "react-icons/fa";
import "./ContactForm.scss";

// ─── Validation Schema - Message is now OPTIONAL ────────────────────────────────────────

const contactSchema = Yup.object({
    name: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .required("Name is required"),
    email: Yup.string()
        .email("Enter a valid email")
        .required("Email is required"),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
        .required("Phone number is required"),
    message: Yup.string(), // Optional field - no validation required
});

// ─── Animation Variants ───────────────────────────────────────────────────────

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
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

const rightItemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

// ─── Contact Form Component ───────────────────────────────────────────────────

const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const handleSubmit = async (values, { resetForm }) => {
        setIsSubmitting(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/contact/submit`,
                {
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    message: values.message || '' // Send empty string if no message
                }
            );

            if (response.data.success) {
                toast.success(
                    <div className="contact-toast">
                        <strong>✨ Message Sent Successfully!</strong>
                        <p>We'll get back to you within 24 hours.</p>
                    </div>,
                    {
                        position: "top-center",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );

                resetForm();
            }
        } catch (err) {
            console.error('Contact form error:', err);

            // Handle rate limiting error (429)
            if (err.response?.status === 429) {
                toast.error(
                    <div className="contact-toast">
                        <strong>⏰ Too Many Requests</strong>
                        <p>{err.response?.data?.message || 'Please wait 3 days before sending another message.'}</p>
                    </div>,
                    {
                        position: "top-center",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );
            }
            // Handle validation errors (400)
            else if (err.response?.status === 400) {
                toast.error(
                    <div className="contact-toast">
                        <strong>⚠️ Validation Error</strong>
                        <p>{err.response?.data?.message || 'Please check your input and try again.'}</p>
                    </div>,
                    {
                        position: "top-center",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );
            }
            // Handle server errors (500)
            else {
                toast.error(
                    <div className="contact-toast">
                        <strong>❌ Something Went Wrong</strong>
                        <p>Failed to send message. Please try again later.</p>
                    </div>,
                    {
                        position: "top-center",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
        },
        validationSchema: contactSchema,
        onSubmit: handleSubmit,
    });

    // Social links - Same as footer with correct order
    const socialLinks = {
        whatsapp: 'https://wa.me/919274778081',
        instagram: 'https://www.instagram.com/satvsar',
        facebook: 'https://www.facebook.com/profile.php?id=61583057774642',
        amazon: 'https://amzn.in/d/036yXkyD'
    };

    return (
        <motion.div
            ref={sectionRef}
            className="contact-main"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
        >
            <div className="contact-main__container">
                {/* Left Column - Form */}
                <motion.div className="contact-form-wrapper" variants={itemVariants}>
                    <div className="contact-form-header">
                        <h2 className="contact-form-header__title">Send Us a Message</h2>
                        <p className="contact-form-header__subtitle">
                            We'd love to hear from you. Fill out the form and we'll respond
                            shortly.
                        </p>
                    </div>

                    <form className="contact-form" onSubmit={formik.handleSubmit}>
                        {/* Name Field */}
                        <div className="contact-form__group">
                            <label className="contact-form__label">
                                <MdPerson className="contact-form__label-icon" />
                                Full Name <span className="required">*</span>
                            </label>
                            <div className="contact-form__input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className={`contact-form__input ${formik.touched.name && formik.errors.name ? "error" : ""
                                        }`}
                                    {...formik.getFieldProps("name")}
                                />
                            </div>
                            {formik.touched.name && formik.errors.name && (
                                <span className="contact-form__error">{formik.errors.name}</span>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="contact-form__group">
                            <label className="contact-form__label">
                                <MdEmailIcon className="contact-form__label-icon" />
                                Email Address <span className="required">*</span>
                            </label>
                            <div className="contact-form__input-wrapper">
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={`contact-form__input ${formik.touched.email && formik.errors.email ? "error" : ""
                                        }`}
                                    {...formik.getFieldProps("email")}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && (
                                <span className="contact-form__error">{formik.errors.email}</span>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div className="contact-form__group">
                            <label className="contact-form__label">
                                <MdPhone className="contact-form__label-icon" />
                                Phone Number <span className="required">*</span>
                            </label>
                            <div className="contact-form__input-wrapper">
                                <input
                                    type="tel"
                                    placeholder="1234567890"
                                    className={`contact-form__input ${formik.touched.phone && formik.errors.phone ? "error" : ""
                                        }`}
                                    {...formik.getFieldProps("phone")}
                                />
                            </div>
                            {formik.touched.phone && formik.errors.phone && (
                                <span className="contact-form__error">{formik.errors.phone}</span>
                            )}
                        </div>

                        {/* Message Field - OPTIONAL now */}
                        <div className="contact-form__group">
                            <label className="contact-form__label">
                                <MdMessage className="contact-form__label-icon" />
                                Your Message <span className="optional">(Optional)</span>
                            </label>
                            <div className="contact-form__input-wrapper">
                                <textarea
                                    rows="4"
                                    placeholder="Tell us how we can help you..."
                                    className={`contact-form__textarea`}
                                    {...formik.getFieldProps("message")}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            className="contact-form__submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="contact-form__spinner"></span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <MdSend />
                                    Send Message
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Right Column - Info */}
                <motion.div className="contact-info-wrapper" variants={rightItemVariants}>
                    <div className="contact-info-card">
                        <div className="contact-info-header">
                            <h2 className="contact-info-header__title">Get in Touch</h2>
                            <p className="contact-info-header__subtitle">
                                Visit us or connect on social media
                            </p>
                        </div>

                        <div className="contact-info-details">
                            {/* Address */}
                            <motion.div
                                className="contact-info-item"
                                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                            >
                                <div className="contact-info-item__icon">
                                    <MdLocationOn />
                                </div>
                                <div className="contact-info-item__content">
                                    <h4>Our Location</h4>
                                    <p>
                                        G.F - 39, Infinity Arcade,
                                        Near Pratapnagar Bridge, ONGC Road,
                                        Pratapnagar, Vadodara 390004, Gujarat (India)
                                    </p>
                                </div>
                            </motion.div>

                            {/* Phone - UPDATED: Only one number */}
                            <motion.div
                                className="contact-info-item"
                                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                            >
                                <div className="contact-info-item__icon">
                                    <MdPhoneInTalk />
                                </div>
                                <div className="contact-info-item__content">
                                    <h4>Call Us</h4>
                                    <p>
                                        <a href="tel:+919274778081">+91 92747 78081</a>
                                    </p>
                                </div>
                            </motion.div>

                            {/* Email */}
                            <motion.div
                                className="contact-info-item"
                                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                            >
                                <div className="contact-info-item__icon">
                                    <MdEmailIcon />
                                </div>
                                <div className="contact-info-item__content">
                                    <h4>Email Us</h4>
                                    <p>
                                        <a href="mailto:info@satvsar.com">info@satvsar.com</a>
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Social Links - UPDATED: Same order as footer: WhatsApp, Instagram, Facebook, Amazon */}
                        <div className="contact-social">
                            <h3 className="contact-social__title">Connect With Us</h3>
                            <div className="contact-social__links">
                                <motion.a
                                    href={socialLinks.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-social__link contact-social__link--whatsapp"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaWhatsapp />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-social__link contact-social__link--instagram"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaInstagram />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-social__link contact-social__link--facebook"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaFacebookF />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.amazon}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-social__link contact-social__link--amazon"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaAmazon />
                                </motion.a>
                            </div>
                        </div>

                        {/* Trust Badge */}
                        <motion.div
                            className="contact-trust-badge"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="contact-trust-badge__icon">
                                <span>🪔</span>
                            </div>
                            <p>
                                "Pure oil from our kitchen to yours.
                                <br />
                                We're here to serve you better!"
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <ToastContainer />
        </motion.div>
    );
};

export default ContactForm;