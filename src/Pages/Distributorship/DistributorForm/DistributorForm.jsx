// DistributorForm.jsx
import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdLocationOn,
    MdMessage,
    MdSend,
    MdCheckCircle,
    MdLocalPhone,
    MdOutlineEmail,
    MdBusiness,
} from 'react-icons/md';
import {
    FaFacebookF,
    FaInstagram,
    FaWhatsapp,
    FaAmazon,
} from 'react-icons/fa';
import './DistributorForm.scss';

// ─── Validation Schema (Message is optional) ───────────────────────────────────

const distributorSchema = Yup.object({
    fullName: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Full name is required'),
    email: Yup.string()
        .email('Enter a valid email')
        .required('Email is required'),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
        .required('Phone number is required'),
    city: Yup.string()
        .min(2, 'City name is required')
        .required('City is required'),
    message: Yup.string(), // Optional field - no validation
});

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

const rightItemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DistributorForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const handleSubmit = async (values, { resetForm }) => {
        setIsSubmitting(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/distributor/submit`,
                {
                    fullName: values.fullName,
                    email: values.email,
                    phone: values.phone,
                    city: values.city,
                    message: values.message || '',
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                toast.success(
                    <div className="dist-toast">
                        <strong>✨ Application Submitted Successfully!</strong>
                        <p>Our team will contact you within 48 hours.</p>
                    </div>,
                    {
                        position: 'top-center',
                        autoClose: 5000,
                    }
                );
                resetForm();
            }
        } catch (error) {
            console.error('Distributor form error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            fullName: '',
            email: '',
            phone: '',
            city: '',
            message: '',
        },
        validationSchema: distributorSchema,
        onSubmit: handleSubmit,
    });

    // Contact info for the right side - UPDATED: Only one phone number
    const contactInfo = {
        address: 'G.F - 39, Infinity Arcade, Near Pratapnagar Bridge, ONGC Road, Pratapnagar, Vadodara-390004. Gujarat (India)',
        email: 'info@satvsar.com',
        phone: '+91 78610 78081', // Updated to single number
        mapUrl: 'https://maps.google.com/?q=Infinity+Arcade+Pratapnagar+Vadodara',
    };

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
            className="distributor-main"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={containerVariants}
        >
            <div className="distributor-main__container">
                {/* Left Column - Form */}
                <motion.div className="distributor-form-wrapper" variants={itemVariants}>
                    <div className="distributor-form-header">
                        <h2 className="distributor-form-header__title">Become a Distributor</h2>
                        <p className="distributor-form-header__subtitle">
                            Join hands with Satvsar and bring purity to every kitchen
                        </p>
                    </div>

                    <form className="distributor-form" onSubmit={formik.handleSubmit}>
                        {/* Full Name Field - Required */}
                        <div className="distributor-form__group">
                            <label className="distributor-form__label">
                                <MdPerson className="distributor-form__label-icon" />
                                Full Name <span className="required">*</span>
                            </label>
                            <div className="distributor-form__input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className={`distributor-form__input ${formik.touched.fullName && formik.errors.fullName ? 'error' : ''
                                        }`}
                                    {...formik.getFieldProps('fullName')}
                                />
                            </div>
                            {formik.touched.fullName && formik.errors.fullName && (
                                <span className="distributor-form__error">{formik.errors.fullName}</span>
                            )}
                        </div>

                        {/* Email Field - Required */}
                        <div className="distributor-form__group">
                            <label className="distributor-form__label">
                                <MdEmail className="distributor-form__label-icon" />
                                Email Address <span className="required">*</span>
                            </label>
                            <div className="distributor-form__input-wrapper">
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={`distributor-form__input ${formik.touched.email && formik.errors.email ? 'error' : ''
                                        }`}
                                    {...formik.getFieldProps('email')}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && (
                                <span className="distributor-form__error">{formik.errors.email}</span>
                            )}
                        </div>

                        {/* Phone Field - Required */}
                        <div className="distributor-form__group">
                            <label className="distributor-form__label">
                                <MdPhone className="distributor-form__label-icon" />
                                Phone Number <span className="required">*</span>
                            </label>
                            <div className="distributor-form__input-wrapper">
                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    className={`distributor-form__input ${formik.touched.phone && formik.errors.phone ? 'error' : ''
                                        }`}
                                    {...formik.getFieldProps('phone')}
                                />
                            </div>
                            {formik.touched.phone && formik.errors.phone && (
                                <span className="distributor-form__error">{formik.errors.phone}</span>
                            )}
                        </div>

                        {/* City Field - Required */}
                        <div className="distributor-form__group">
                            <label className="distributor-form__label">
                                <MdLocationOn className="distributor-form__label-icon" />
                                City / District <span className="required">*</span>
                            </label>
                            <div className="distributor-form__input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Enter your city"
                                    className={`distributor-form__input ${formik.touched.city && formik.errors.city ? 'error' : ''
                                        }`}
                                    {...formik.getFieldProps('city')}
                                />
                            </div>
                            {formik.touched.city && formik.errors.city && (
                                <span className="distributor-form__error">{formik.errors.city}</span>
                            )}
                        </div>

                        {/* Message Field - Optional */}
                        <div className="distributor-form__group">
                            <label className="distributor-form__label">
                                <MdMessage className="distributor-form__label-icon" />
                                Message <span className="optional">(Optional)</span>
                            </label>
                            <div className="distributor-form__input-wrapper">
                                <textarea
                                    rows="4"
                                    placeholder="Tell us about your business or any questions..."
                                    className="distributor-form__textarea"
                                    {...formik.getFieldProps('message')}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            className="distributor-form__submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="distributor-form__spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <MdSend />
                                    Apply Now
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Right Column - Info */}
                <motion.div className="distributor-info-wrapper" variants={rightItemVariants}>
                    <div className="distributor-info-card">
                        {/* Headline Section - Simple and Emotional */}
                        <div className="distributor-headline">
                            <div className="distributor-headline__icon">
                                <MdBusiness />
                            </div>
                            <h2 className="distributor-headline__title">Grow with Satvsar</h2>
                            <p className="distributor-headline__subtitle">
                                Partner with a brand that prioritizes purity, quality, and trust.
                                Join our family of distributors and bring healthy cooking oil to every home.
                            </p>
                        </div>

                        {/* Contact Info with Links - UPDATED: Single phone number */}
                        <div className="distributor-contact">
                            <h3 className="distributor-contact__title">Get in Touch</h3>

                            <div className="distributor-contact__item">
                                <div className="distributor-contact__icon">
                                    <MdLocationOn />
                                </div>
                                <div className="distributor-contact__content">
                                    <strong>Address</strong>
                                    <a
                                        href={contactInfo.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {contactInfo.address}
                                    </a>
                                </div>
                            </div>

                            <div className="distributor-contact__item">
                                <div className="distributor-contact__icon">
                                    <MdOutlineEmail />
                                </div>
                                <div className="distributor-contact__content">
                                    <strong>Email</strong>
                                    <a href={`mailto:${contactInfo.email}`}>
                                        {contactInfo.email}
                                    </a>
                                </div>
                            </div>

                            <div className="distributor-contact__item">
                                <div className="distributor-contact__icon">
                                    <MdLocalPhone />
                                </div>
                                <div className="distributor-contact__content">
                                    <strong>Call Us</strong>
                                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>
                                        {contactInfo.phone}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Social Links - UPDATED: Same order as footer: WhatsApp, Instagram, Facebook, Amazon */}
                        <div className="distributor-social">
                            <h3 className="distributor-social__title">Follow Us</h3>
                            <div className="distributor-social__links">
                                <motion.a
                                    href={socialLinks.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="distributor-social__link"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaWhatsapp />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="distributor-social__link"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaInstagram />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="distributor-social__link"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaFacebookF />
                                </motion.a>
                                <motion.a
                                    href={socialLinks.amazon}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="distributor-social__link"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaAmazon />
                                </motion.a>
                            </div>
                        </div>

                        {/* Trust Badge */}
                        <motion.div
                            className="distributor-trust-badge"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="distributor-trust-badge__icon">
                                <span>🪔</span>
                            </div>
                            <p>
                                "Pure oil from our kitchen to yours.
                                <br />
                                Grow with Satvsar - Trusted by millions."
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <ToastContainer />
        </motion.div>
    );
};

export default DistributorForm;