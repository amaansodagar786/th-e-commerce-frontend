import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdArrowBack, MdKey
} from "react-icons/md";
import "./UserAuth.scss";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const loginSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

const registerSchema = Yup.object({
  name: Yup.string().min(2, "Name must be at least 2 characters").required("Name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

const forgotPasswordSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

const resetPasswordSchema = Yup.object({
  otp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers")
    .required("OTP is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required("Please confirm your password"),
});

// ─── Password Input Component with Eye Toggle ─────────────────────────────────

const PasswordInput = ({ name, value, onChange, placeholder, disabled, error, touched }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`ua-input-wrap ${error && touched ? "ua-input-wrap--error" : ""}`}>
      <MdLock className="ua-input-icon" />
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        className="ua-eye"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        tabIndex={-1}
      >
        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
      </button>
    </div>
  );
};

// ─── Forgot Password Modal (SIMPLIFIED & DEBUGGED) ────────────────────────────

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const emailValue = e.target.email.value;
    if (!emailValue) return toast.error('Email is required');
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/forgot-password/send-otp`,
        { email: emailValue }
      );
      if (response.data.success) {
        toast.success('OTP sent!');
        setEmail(emailValue);
        setStep('otp');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('OTP is required');
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/forgot-password/verify-otp`,
        { email, otp }
      );
      if (response.data.success) {
        toast.success('OTP verified!');
        setStep('password');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
   

    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordError('');

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/forgot-password/reset`,
        { email, newPassword }
      );
      if (response.data.success) {
        toast.success('Password reset successfully! Please login.');
        handleClose();
      }
    } catch (err) {
      console.error('❌ Reset error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setLoading(false);
    onClose();
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/forgot-password/send-otp`,
        { email }
      );
      if (response.data.success) toast.success('OTP resent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ua-modal-overlay" onClick={handleClose}>
      <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ua-modal-header">
          <button className="ua-modal-back" onClick={handleClose}>
            <MdArrowBack />
          </button>
          <h2>Reset Password</h2>
          <button className="ua-modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="ua-modal-body">
          {step === 'email' && (
            <form onSubmit={handleSendOTP}>
              <p className="ua-modal-desc">Enter your email address to receive an OTP.</p>
              <div className="ua-field">
                <label>Email Address</label>
                <div className="ua-input-wrap">
                  <MdEmail className="ua-input-icon" />
                  <input type="email" name="email" placeholder="you@example.com" disabled={loading} required />
                </div>
              </div>
              <button type="submit" className="ua-btn ua-btn-modal" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <p className="ua-modal-desc">We've sent a 6-digit OTP to <strong>{email}</strong></p>
              <div className="ua-field">
                <label>Enter OTP</label>
                <div className="ua-input-wrap">
                  <MdKey className="ua-input-icon" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength="6"
                    disabled={loading}
                    className="ua-otp-input"
                  />
                </div>
              </div>
              <div className="ua-modal-actions">
                <button type="button" className="ua-btn-outline" onClick={() => setStep('email')} disabled={loading}>
                  Back
                </button>
                <button type="submit" className="ua-btn ua-btn-modal" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <button type="button" className="ua-resend-link" onClick={handleResendOTP} disabled={loading}>
                Resend OTP
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword}>
              <p className="ua-modal-desc">Set a new password for <strong>{email}</strong></p>

              <div className="ua-field">
                <label>New Password</label>
                <div className="ua-input-wrap">
                  <MdLock className="ua-input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ua-eye"
                    onClick={(e) => {
                      const input = e.target.closest('.ua-input-wrap').querySelector('input');
                      if (input) input.type = input.type === 'password' ? 'text' : 'password';
                    }}
                    tabIndex={-1}
                  >
                    <MdVisibility />
                  </button>
                </div>
              </div>

              <div className="ua-field">
                <label>Confirm New Password</label>
                <div className="ua-input-wrap">
                  <MdLock className="ua-input-icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ua-eye"
                    onClick={(e) => {
                      const input = e.target.closest('.ua-input-wrap').querySelector('input');
                      if (input) input.type = input.type === 'password' ? 'text' : 'password';
                    }}
                    tabIndex={-1}
                  >
                    <MdVisibility />
                  </button>
                </div>
              </div>

              {passwordError && <div className="ua-error" style={{ marginBottom: 12 }}>⚠ {passwordError}</div>}
              <div className="ua-password-requirements">
                <small>Password must be at least 6 characters</small>
              </div>

              <div className="ua-modal-actions">
                <button type="button" className="ua-btn-outline" onClick={() => setStep('otp')} disabled={loading}>
                  Back
                </button>
                <button type="submit" className="ua-btn ua-btn-modal" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch, onForgotPassword }) {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (values) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/login`, {
        email: values.email,
        password: values.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Welcome back! Redirecting...", {
        autoClose: 1500,
        onClose: () => navigate("/"),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: handleLogin,
  });

  return (
    <div className="ua-form-wrapper">
      <div className="ua-form-header">
        <div className="ua-flame">🪔</div>
        <h1 className="ua-title">Welcome Back</h1>
        <p className="ua-subtitle">Sign in to your account</p>
      </div>

      <div className="ua-form">
        {/* Email */}
        <div className={`ua-field ${formik.touched.email && formik.errors.email ? "ua-field--error" : ""}`}>
          <label>Email Address</label>
          <div className="ua-input-wrap">
            <MdEmail className="ua-input-icon" />
            <input
              type="email"
              placeholder="you@example.com"
              {...formik.getFieldProps("email")}
            />
          </div>
          {formik.touched.email && formik.errors.email && (
            <span className="ua-error">⚠ {formik.errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className={`ua-field ${formik.touched.password && formik.errors.password ? "ua-field--error" : ""}`}>
          <label>Password</label>
          <div className="ua-input-wrap">
            <MdLock className="ua-input-icon" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              {...formik.getFieldProps("password")}
            />
            <button
              type="button"
              className="ua-eye"
              onClick={() => setShowPass((p) => !p)}
              tabIndex={-1}
            >
              {showPass ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <span className="ua-error">⚠ {formik.errors.password}</span>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="ua-forgot-link">
          <button type="button" onClick={onForgotPassword} className="ua-forgot-btn">
            Forgot Password?
          </button>
        </div>

        <button
          className="ua-btn"
          onClick={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting
            ? <><span className="ua-spinner" /> Signing In...</>
            : "Sign In"
          }
        </button>
      </div>

      <p className="ua-switch-text">
        Don't have an account?{" "}
        <button className="ua-switch-link" onClick={onSwitch}>Create Account</button>
      </p>
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }) {
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async (values, { resetForm }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      toast.success("Account created! Please sign in.", {
        autoClose: 1800,
        onClose: () => onSwitch(),
      });
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: registerSchema,
    onSubmit: handleRegister,
  });

  return (
    <div className="ua-form-wrapper">
      <div className="ua-form-header">
        <div className="ua-flame">🪔</div>
        <h1 className="ua-title">Create Account</h1>
        <p className="ua-subtitle">Join us and start shopping</p>
      </div>

      <div className="ua-form">
        {/* Name */}
        <div className={`ua-field ${formik.touched.name && formik.errors.name ? "ua-field--error" : ""}`}>
          <label>Full Name</label>
          <div className="ua-input-wrap">
            <MdPerson className="ua-input-icon" />
            <input
              type="text"
              placeholder="Your full name"
              {...formik.getFieldProps("name")}
            />
          </div>
          {formik.touched.name && formik.errors.name && (
            <span className="ua-error">⚠ {formik.errors.name}</span>
          )}
        </div>

        {/* Email */}
        <div className={`ua-field ${formik.touched.email && formik.errors.email ? "ua-field--error" : ""}`}>
          <label>Email Address</label>
          <div className="ua-input-wrap">
            <MdEmail className="ua-input-icon" />
            <input
              type="email"
              placeholder="you@example.com"
              {...formik.getFieldProps("email")}
            />
          </div>
          {formik.touched.email && formik.errors.email && (
            <span className="ua-error">⚠ {formik.errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className={`ua-field ${formik.touched.password && formik.errors.password ? "ua-field--error" : ""}`}>
          <label>Password</label>
          <div className="ua-input-wrap">
            <MdLock className="ua-input-icon" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Min. 6 characters"
              {...formik.getFieldProps("password")}
            />
            <button
              type="button"
              className="ua-eye"
              onClick={() => setShowPass((p) => !p)}
              tabIndex={-1}
            >
              {showPass ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <span className="ua-error">⚠ {formik.errors.password}</span>
          )}
        </div>

        <button
          className="ua-btn"
          onClick={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting
            ? <><span className="ua-spinner" /> Creating Account...</>
            : "Create Account"
          }
        </button>
      </div>

      <p className="ua-switch-text">
        Already have an account?{" "}
        <button className="ua-switch-link" onClick={onSwitch}>Sign In</button>
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function UserAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="user-auth">
      <div className="ua-card">

        {/* Tab Bar */}
        <div className="ua-tabs">
          <button
            className={`ua-tab ${isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`ua-tab ${!isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
          <div className={`ua-tab-indicator ${isLogin ? "left" : "right"}`} />
        </div>

        {/* Sliding Panels */}
        <div className={`ua-panels ${isLogin ? "show-login" : "show-register"}`}>
          <div className="ua-panel">
            <LoginForm
              onSwitch={() => setIsLogin(false)}
              onForgotPassword={() => setShowForgotPassword(true)}
            />
          </div>
          <div className="ua-panel">
            <RegisterForm onSwitch={() => setIsLogin(true)} />
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
}

export default UserAuth;