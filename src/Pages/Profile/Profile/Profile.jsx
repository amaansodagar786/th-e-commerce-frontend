// Profile.jsx - FIXED VERSION with Password Toggle
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdCake,
    MdWc,
    MdLock,
    MdLocationOn,
    MdFavorite,
    MdShoppingBag,
    MdLogout,
    MdEdit,
    MdDelete,
    MdStar,
    MdAdd,
    MdArrowBack,
    MdHome,
    MdWork,
    MdPlace,
    MdCheckCircle,
    MdKey,
    MdSend,
    MdVerified,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";
import "./Profile.scss";
import FooterTopPattern from "../../../Components/Footer/FooterTopPattern/FooterTopPattern";

// ─── Password Input Component with Eye Toggle ───────────────────────────────────

const PasswordInput = ({ label, name, value, onChange, placeholder, disabled, required, showRequirements }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-group">
            <label htmlFor={name}>{label} {required && '*'}</label>
            <div className="password-input-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="password-input"
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={disabled}
                >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
            </div>
            {showRequirements && (
                <small className="form-help">Password must be at least 6 characters</small>
            )}
        </div>
    );
};

// ─── Address Card Component ───────────────────────────────────────────────────

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
    const getAddressIcon = (type) => {
        switch (type) {
            case "home":
                return <MdHome />;
            case "work":
                return <MdWork />;
            default:
                return <MdPlace />;
        }
    };

    return (
        <div className={`address-card ${address.isDefault ? "default" : ""}`}>
            <div className="address-card__header">
                <div className="address-card__type">
                    <span className="address-card__type-icon">{getAddressIcon(address.addressType)}</span>
                    <span className="address-card__type-text">{address.addressType}</span>
                    {address.isDefault && (
                        <span className="address-card__default-badge">
                            <MdStar /> Default
                        </span>
                    )}
                </div>

                <div className="address-card__actions">
                    <button
                        onClick={() => onEdit(address)}
                        className="action-btn action-btn--edit"
                    >
                        <MdEdit /> Edit
                    </button>
                    <button
                        onClick={() => onDelete(address.addressId)}
                        className="action-btn action-btn--delete"
                    >
                        <MdDelete /> Delete
                    </button>
                </div>
            </div>

            <div className="address-card__body">
                <p className="address-card__name">{address.fullName}</p>
                <p className="address-card__contact">
                    <MdPhone /> {address.mobile}
                    {address.email && (
                        <>
                            {" "}
                            | <MdEmail /> {address.email}
                        </>
                    )}
                </p>

                <div className="address-card__details">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    {address.landmark && (
                        <p>
                            <strong>Landmark:</strong> {address.landmark}
                        </p>
                    )}
                    <p>
                        {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p>{address.country}</p>
                </div>

                {address.instructions && (
                    <div className="address-card__instructions">
                        <strong>Delivery Instructions:</strong> {address.instructions}
                    </div>
                )}

                {!address.isDefault && (
                    <button
                        onClick={() => onSetDefault(address.addressId)}
                        className="address-card__set-default"
                    >
                        <MdCheckCircle /> Set as Default
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Address Form Component ───────────────────────────────────────────────────

const AddressForm = ({ address, onSubmit, onCancel, mode }) => {
    const [formData, setFormData] = useState({
        fullName: address?.fullName || "",
        mobile: address?.mobile || "",
        email: address?.email || "",
        addressLine1: address?.addressLine1 || "",
        addressLine2: address?.addressLine2 || "",
        landmark: address?.landmark || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        country: address?.country || "India",
        addressType: address?.addressType || "home",
        instructions: address?.instructions || "",
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
        if (!formData.mobile.match(/^[0-9]{10}$/)) newErrors.mobile = "Enter valid 10-digit number";
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
        if (!formData.pincode.match(/^[0-9]{6}$/)) newErrors.pincode = "Enter valid 6-digit pincode";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="address-form">
            <div className="address-form__header">
                <h3>{mode === "edit" ? "Edit Address" : "Add New Address"}</h3>
                <button className="address-form__close" onClick={onCancel}>
                    ×
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="address-form__grid">
                    <div className="form-group full-width">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                        />
                        {errors.fullName && <span className="error">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                        <label>Mobile Number *</label>
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                            maxLength="10"
                        />
                        {errors.mobile && <span className="error">{errors.mobile}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email (Optional)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Address Line 1 *</label>
                        <input
                            type="text"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                            placeholder="House number, street, area"
                        />
                        {errors.addressLine1 && <span className="error">{errors.addressLine1}</span>}
                    </div>

                    <div className="form-group full-width">
                        <label>Address Line 2 (Optional)</label>
                        <input
                            type="text"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleChange}
                            placeholder="Apartment, suite, building"
                        />
                    </div>

                    <div className="form-group">
                        <label>Landmark (Optional)</label>
                        <input
                            type="text"
                            name="landmark"
                            value={formData.landmark}
                            onChange={handleChange}
                            placeholder="Near hospital, school"
                        />
                    </div>

                    <div className="form-group">
                        <label>City *</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                        />
                        {errors.city && <span className="error">{errors.city}</span>}
                    </div>

                    <div className="form-group">
                        <label>State *</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                        />
                        {errors.state && <span className="error">{errors.state}</span>}
                    </div>

                    <div className="form-group">
                        <label>Pincode *</label>
                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            placeholder="6-digit pincode"
                            maxLength="6"
                        />
                        {errors.pincode && <span className="error">{errors.pincode}</span>}
                    </div>

                    <div className="form-group">
                        <label>Country</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Country"
                        />
                    </div>

                    <div className="form-group">
                        <label>Address Type *</label>
                        <select name="addressType" value={formData.addressType} onChange={handleChange}>
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group full-width">
                        <label>Delivery Instructions (Optional)</label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            placeholder="Gate code, floor number, etc."
                            rows="2"
                        />
                    </div>
                </div>

                <div className="address-form__actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit">
                        {mode === "edit" ? "Update Address" : "Save Address"}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Main Profile Component ───────────────────────────────────────────────────

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // Profile data
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        mobile: "",
        age: "",
        gender: "",
    });

    // Password data
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Forgot Password data
    const [forgotPassword, setForgotPassword] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
        step: "email", // email -> otp -> password
        loading: false
    });

    // Address data
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const genderOptions = [
        { value: "", label: "Select Gender" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
    ];

    // Get auth token
    const getToken = () => localStorage.getItem("token");

    // Fetch user profile
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/profile/get`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                const user = response.data.user;
                setProfile({
                    name: user.name || "",
                    email: user.email || "",
                    mobile: user.mobile || "",
                    age: user.age || "",
                    gender: user.gender || "",
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                toast.error("Failed to load profile. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch addresses
    const fetchAddresses = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/profile/addresses`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setAddresses(response.data.addresses);
            }
        } catch (err) {
            console.error("Error fetching addresses:", err);
            if (err.response?.status === 401) {
                handleLogout();
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === "addresses") {
            fetchAddresses();
        }
    }, [activeTab]);

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const profileData = {
                name: profile.name.trim(),
                email: profile.email.trim(),
                mobile: profile.mobile.trim(),
                age: profile.age ? parseInt(profile.age) : null,
                gender: profile.gender,
            };

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/update`,
                profileData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Profile updated successfully!");

                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                }

                setProfile({
                    name: response.data.user.name,
                    email: response.data.user.email,
                    mobile: response.data.user.mobile,
                    age: response.data.user.age || "",
                    gender: response.data.user.gender,
                });
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                toast.error(err.response?.data?.message || "Failed to update profile.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        try {
            setSaving(true);
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/change-password`,
                passwords,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Password changed successfully!");
                setPasswords({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }
        } catch (err) {
            console.error("Error changing password:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                toast.error(err.response?.data?.message || "Failed to change password.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Forgot Password Handlers
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!forgotPassword.email) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setForgotPassword(prev => ({ ...prev, loading: true }));
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/forgot-password/send-otp`,
                { email: forgotPassword.email }
            );

            if (response.data.success) {
                toast.success('OTP sent to your email!');
                setForgotPassword(prev => ({ ...prev, step: 'otp', loading: false }));
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            toast.error(err.response?.data?.message || 'Failed to send OTP');
            setForgotPassword(prev => ({ ...prev, loading: false }));
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!forgotPassword.otp) {
            toast.error('Please enter OTP');
            return;
        }

        try {
            setForgotPassword(prev => ({ ...prev, loading: true }));
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/forgot-password/verify-otp`,
                {
                    email: forgotPassword.email,
                    otp: forgotPassword.otp
                }
            );

            if (response.data.success) {
                toast.success('OTP verified! Please set new password.');
                setForgotPassword(prev => ({ ...prev, step: 'password', loading: false }));
            }
        } catch (err) {
            console.error('Error verifying OTP:', err);
            toast.error(err.response?.data?.message || 'Invalid OTP');
            setForgotPassword(prev => ({ ...prev, loading: false }));
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (forgotPassword.newPassword !== forgotPassword.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (forgotPassword.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setForgotPassword(prev => ({ ...prev, loading: true }));
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/forgot-password/reset`,
                {
                    email: forgotPassword.email,
                    newPassword: forgotPassword.newPassword
                }
            );

            if (response.data.success) {
                toast.success('Password reset successfully! Please login with new password.');
                setForgotPassword({
                    email: '',
                    otp: '',
                    newPassword: '',
                    confirmPassword: '',
                    step: 'email',
                    loading: false
                });
                setActiveTab('profile');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
            toast.error(err.response?.data?.message || 'Failed to reset password');
            setForgotPassword(prev => ({ ...prev, loading: false }));
        }
    };

    // Address CRUD Operations
    const handleAddAddress = async (addressData) => {
        try {
            setSaving(true);
            const token = getToken();
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/address/add`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Address added successfully!");
                setShowAddressForm(false);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error adding address:", err);
            toast.error(err.response?.data?.message || "Failed to add address.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAddress = async (addressData) => {
        try {
            setSaving(true);
            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/update/${editingAddress.addressId}`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Address updated successfully!");
                setShowAddressForm(false);
                setEditingAddress(null);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error updating address:", err);
            toast.error(err.response?.data?.message || "Failed to update address.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this address?");
        if (!confirmDelete) return;

        try {
            setSaving(true);
            const token = getToken();
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/profile/address/delete/${addressId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Address deleted successfully!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            toast.error(err.response?.data?.message || "Failed to delete address.");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            setSaving(true);
            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/set-default/${addressId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("Default address updated!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error setting default address:", err);
            toast.error(err.response?.data?.message || "Failed to set default address.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setShowAddressForm(true);
    };

    const handleCancelAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
    };

    const handleSubmitAddress = (addressData) => {
        if (editingAddress) {
            handleUpdateAddress(addressData);
        } else {
            handleAddAddress(addressData);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        toast.info("Logged out successfully!");
        setTimeout(() => navigate("/login"), 1000);
    };

    // Handle input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChangeInput = (e) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Render loading state
    if (loading && activeTab === "profile") {
        return (
            <div className="profile-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    // Check authentication
    const token = getToken();
    if (!token) {
        return (
            <div className="profile-container">
                <div className="login-prompt">
                    <h2>Login Required</h2>
                    <p>Please login to view your profile.</p>
                    <button onClick={() => navigate("/login")} className="auth-btn">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Forgot Password Form Render
    const renderForgotPasswordForm = () => (
        <div className="forgot-password-form">
            <h2>Reset Password</h2>
            <p className="form-description">
                Enter your email address to receive an OTP for password reset.
            </p>

            {forgotPassword.step === 'email' && (
                <form onSubmit={handleSendOTP}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={forgotPassword.email}
                            onChange={(e) => setForgotPassword(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your registered email"
                            required
                            disabled={forgotPassword.loading}
                        />
                        <small className="form-help">We'll send a 6-digit OTP to this email</small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={forgotPassword.loading}
                        >
                            {forgotPassword.loading ? 'Sending...' : 'Send OTP'}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setActiveTab('profile')}
                            disabled={forgotPassword.loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {forgotPassword.step === 'otp' && (
                <form onSubmit={handleVerifyOTP}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={forgotPassword.email}
                            disabled
                            className="disabled-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Enter OTP</label>
                        <div className="otp-input-wrapper">
                            <input
                                type="text"
                                value={forgotPassword.otp}
                                onChange={(e) => setForgotPassword(prev => ({ ...prev, otp: e.target.value }))}
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required
                                disabled={forgotPassword.loading}
                                className="otp-input"
                            />
                            <button
                                type="button"
                                className="resend-otp-btn"
                                onClick={handleSendOTP}
                                disabled={forgotPassword.loading}
                            >
                                Resend OTP
                            </button>
                        </div>
                        <small className="form-help">OTP sent to your email. Valid for 10 minutes.</small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={forgotPassword.loading}
                        >
                            {forgotPassword.loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setForgotPassword(prev => ({ ...prev, step: 'email', otp: '' }))}
                            disabled={forgotPassword.loading}
                        >
                            Back
                        </button>
                    </div>
                </form>
            )}

            {forgotPassword.step === 'password' && (
                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={forgotPassword.email}
                            disabled
                            className="disabled-input"
                        />
                    </div>

                    <PasswordInput
                        label="New Password"
                        name="newPassword"
                        value={forgotPassword.newPassword}
                        onChange={(e) => setForgotPassword(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min 6 characters)"
                        required={true}
                        disabled={forgotPassword.loading}
                        showRequirements={true}
                    />

                    <PasswordInput
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={forgotPassword.confirmPassword}
                        onChange={(e) => setForgotPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        required={true}
                        disabled={forgotPassword.loading}
                        showRequirements={false}
                    />

                    <div className="password-requirements">
                        <h4>Password Requirements:</h4>
                        <ul>
                            <li>Minimum 6 characters</li>
                            <li>Use a mix of letters and numbers</li>
                            <li>Avoid common words or patterns</li>
                        </ul>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={forgotPassword.loading}
                        >
                            {forgotPassword.loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setForgotPassword(prev => ({ ...prev, step: 'email', newPassword: '', confirmPassword: '' }))}
                            disabled={forgotPassword.loading}
                        >
                            Back
                        </button>
                    </div>
                </form>
            )}
        </div>
    );

    return (
        <>
            <div className="profile-container">
                <ToastContainer
                    position="top-center"
                    autoClose={3000}
                    theme="light"
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                />

                <div className="profile-header">
                    <h1>My Profile</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        <MdLogout /> Logout
                    </button>
                </div>

                <div className="profile-content">
                    {/* Sidebar Navigation */}
                    <div className="profile-sidebar">
                        <div className="sidebar-user">
                            <div className="user-avatar">{profile.name?.charAt(0).toUpperCase() || "U"}</div>
                            <div className="user-info">
                                <h3>{profile.name || "User"}</h3>
                                <p>{profile.email}</p>
                            </div>
                        </div>

                        <nav className="sidebar-nav">
                            <button
                                className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                                onClick={() => setActiveTab("profile")}
                            >
                                <MdPerson /> Personal Info
                            </button>
                            <button
                                className={`nav-btn ${activeTab === "password" ? "active" : ""}`}
                                onClick={() => setActiveTab("password")}
                            >
                                <MdLock /> Change Password
                            </button>
                            <button
                                className={`nav-btn ${activeTab === "forgot-password" ? "active" : ""}`}
                                onClick={() => setActiveTab("forgot-password")}
                            >
                                <MdKey /> Forgot Password
                            </button>
                            <button
                                className={`nav-btn ${activeTab === "addresses" ? "active" : ""}`}
                                onClick={() => setActiveTab("addresses")}
                            >
                                <MdLocationOn /> My Addresses
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="profile-main">
                        {activeTab === "profile" && (
                            <form className="profile-form" onSubmit={handleProfileUpdate}>
                                <h2>Personal Information</h2>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleProfileChange}
                                            required
                                            disabled={saving}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email Address *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                            required
                                            disabled
                                            placeholder="Enter your email"
                                        />
                                        <small className="form-help">Email cannot be changed</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="mobile">Mobile Number</label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={profile.mobile}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                            placeholder="Enter 10-digit mobile number"
                                            maxLength="10"
                                        />
                                        <small className="form-help">Optional - 10 digit Indian number</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="age">Age</label>
                                        <input
                                            type="number"
                                            id="age"
                                            name="age"
                                            value={profile.age}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                            placeholder="Enter your age"
                                            min="1"
                                            max="120"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="gender">Gender</label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={profile.gender}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                        >
                                            {genderOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-btn" disabled={saving}>
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={fetchProfile}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === "password" && (
                            <form className="password-form" onSubmit={handlePasswordChange}>
                                <h2>Change Password</h2>
                                <p className="form-description">
                                    For security, please enter your current password and then your new password.
                                </p>

                                <PasswordInput
                                    label="Current Password"
                                    name="oldPassword"
                                    value={passwords.oldPassword}
                                    onChange={handlePasswordChangeInput}
                                    placeholder="Enter current password"
                                    required={true}
                                    disabled={saving}
                                    showRequirements={false}
                                />

                                <PasswordInput
                                    label="New Password"
                                    name="newPassword"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChangeInput}
                                    placeholder="Enter new password (min 6 characters)"
                                    required={true}
                                    disabled={saving}
                                    showRequirements={true}
                                />

                                <PasswordInput
                                    label="Confirm New Password"
                                    name="confirmPassword"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChangeInput}
                                    placeholder="Re-enter new password"
                                    required={true}
                                    disabled={saving}
                                    showRequirements={false}
                                />

                                <div className="password-requirements">
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li>Minimum 6 characters</li>
                                        <li>Use a mix of letters and numbers</li>
                                        <li>Avoid common words or patterns</li>
                                    </ul>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-btn" disabled={saving}>
                                        {saving ? "Changing Password..." : "Change Password"}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => {
                                            setPasswords({
                                                oldPassword: "",
                                                newPassword: "",
                                                confirmPassword: "",
                                            });
                                            setActiveTab("profile");
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === "forgot-password" && renderForgotPasswordForm()}

                        {activeTab === "addresses" && (
                            <div className="addresses-tab">
                                <div className="addresses-header">
                                    <h2>My Addresses</h2>
                                    <button
                                        className="add-address-btn"
                                        onClick={() => setShowAddressForm(true)}
                                        disabled={saving}
                                    >
                                        <MdAdd /> Add New Address
                                    </button>
                                </div>

                                {showAddressForm && (
                                    <AddressForm
                                        address={editingAddress}
                                        onSubmit={handleSubmitAddress}
                                        onCancel={handleCancelAddressForm}
                                        mode={editingAddress ? "edit" : "add"}
                                    />
                                )}

                                {addresses.length === 0 && !showAddressForm ? (
                                    <div className="no-addresses">
                                        <div className="empty-state">
                                            <span className="empty-icon">📍</span>
                                            <h3>No addresses saved</h3>
                                            <p>Add your first address to make checkout faster!</p>
                                            <button
                                                className="add-first-btn"
                                                onClick={() => setShowAddressForm(true)}
                                            >
                                                Add Your First Address
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="addresses-list">
                                        {addresses.map((address) => (
                                            <AddressCard
                                                key={address.addressId}
                                                address={address}
                                                onEdit={handleEditAddress}
                                                onDelete={handleDeleteAddress}
                                                onSetDefault={handleSetDefaultAddress}
                                            />
                                        ))}
                                    </div>
                                )}

                                {addresses.length > 0 && (
                                    <div className="addresses-stats">
                                        <p>Total addresses: {addresses.length}</p>
                                        <p>
                                            Default address:{" "}
                                            {addresses.find((a) => a.isDefault)?.city || "Not set"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FooterTopPattern bgColor="#fefcf2" />
        </>
    );
};

export default Profile;