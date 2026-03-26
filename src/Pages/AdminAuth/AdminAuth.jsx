import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminAuth.scss";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const loginSchema = Yup.object({
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
});

const registerSchema = Yup.object({
    name: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .required("Name is required"),
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
});

// ─── API Handlers ─────────────────────────────────────────────────────────────

const handleLoginSubmit = async (values, navigate) => {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/admin/login`,
            {
                email: values.email,
                password: values.password,
            }
        );

        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("role", res.data.admin.role);

        if (res.data.admin.role === "admin") {
            toast.success("Welcome back! Redirecting to dashboard...", {
                autoClose: 1500,
                onClose: () => navigate("/admin/dashboard"),
            });
        } else {
            toast.error("Access denied. You are not an admin.");
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Login failed. Try again.");
    }
};

const handleRegisterSubmit = async (values, setIsLogin) => {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/admin/register`, {
            name: values.name,
            email: values.email,
            password: values.password,
        });

        toast.success("Account created! Please log in.", {
            autoClose: 1800,
            onClose: () => setIsLogin(true),
        });
    } catch (err) {
        toast.error(err.response?.data?.message || "Registration failed. Try again.");
    }
};

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }) {
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: { email: "", password: "" },
        validationSchema: loginSchema,
        onSubmit: (values) => handleLoginSubmit(values, navigate),
    });

    return (
        <div className="auth-form-wrapper">
            <div className="auth-form-header">
                <div className="flame-icon">🪔</div>
                <h1 className="auth-title">Divya Admin</h1>
                <p className="auth-subtitle">Sign in to your sacred workspace</p>
            </div>

            <div className="auth-form">
                <div className={`form-group ${formik.touched.email && formik.errors.email ? "has-error" : ""}`}>
                    <label htmlFor="login-email">Email Address</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="admin@divyacandles.com"
                        {...formik.getFieldProps("email")}
                    />
                    {formik.touched.email && formik.errors.email && (
                        <span className="field-error">{formik.errors.email}</span>
                    )}
                </div>

                <div className={`form-group ${formik.touched.password && formik.errors.password ? "has-error" : ""}`}>
                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        {...formik.getFieldProps("password")}
                    />
                    {formik.touched.password && formik.errors.password && (
                        <span className="field-error">{formik.errors.password}</span>
                    )}
                </div>

                <button
                    className="auth-btn"
                    onClick={formik.handleSubmit}
                    disabled={formik.isSubmitting}
                >
                    {formik.isSubmitting ? (
                        <span className="btn-loading">
                            <span className="spinner" />
                            Signing In...
                        </span>
                    ) : (
                        "Sign In"
                    )}
                </button>
            </div>

            <p className="auth-switch-text">
                New admin?{" "}
                <button className="switch-link" onClick={onSwitch}>
                    Create Account
                </button>
            </p>
        </div>
    );
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }) {
    const formik = useFormik({
        initialValues: { name: "", email: "", password: "" },
        validationSchema: registerSchema,
        onSubmit: (values) => handleRegisterSubmit(values, onSwitch),
    });

    return (
        <div className="auth-form-wrapper">
            <div className="auth-form-header">
                <div className="flame-icon">🪔</div>
                <h1 className="auth-title">Divya Admin</h1>
                <p className="auth-subtitle">Create your admin account</p>
            </div>

            <div className="auth-form">
                <div className={`form-group ${formik.touched.name && formik.errors.name ? "has-error" : ""}`}>
                    <label htmlFor="reg-name">Full Name</label>
                    <input
                        id="reg-name"
                        type="text"
                        placeholder="Admin Name"
                        {...formik.getFieldProps("name")}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <span className="field-error">{formik.errors.name}</span>
                    )}
                </div>

                <div className={`form-group ${formik.touched.email && formik.errors.email ? "has-error" : ""}`}>
                    <label htmlFor="reg-email">Email Address</label>
                    <input
                        id="reg-email"
                        type="email"
                        placeholder="admin@divyacandles.com"
                        {...formik.getFieldProps("email")}
                    />
                    {formik.touched.email && formik.errors.email && (
                        <span className="field-error">{formik.errors.email}</span>
                    )}
                </div>

                <div className={`form-group ${formik.touched.password && formik.errors.password ? "has-error" : ""}`}>
                    <label htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        {...formik.getFieldProps("password")}
                    />
                    {formik.touched.password && formik.errors.password && (
                        <span className="field-error">{formik.errors.password}</span>
                    )}
                </div>

                <button
                    className="auth-btn"
                    onClick={formik.handleSubmit}
                    disabled={formik.isSubmitting}
                >
                    {formik.isSubmitting ? (
                        <span className="btn-loading">
                            <span className="spinner" />
                            Creating Account...
                        </span>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </div>

            <p className="auth-switch-text">
                Already have an account?{" "}
                <button className="switch-link" onClick={onSwitch}>
                    Sign In
                </button>
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminAuth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="admin-auth">
            {/* Ambient background particles */}
            <div className="bg-particles">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className={`particle particle-${i + 1}`} />
                ))}
            </div>

            <div className="auth-card">
                {/* Toggle Tab Bar */}
                <div className="auth-tabs">
                    <button
                        className={`tab-btn ${isLogin ? "active" : ""}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Sign In
                    </button>
                    <button
                        className={`tab-btn ${!isLogin ? "active" : ""}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Register
                    </button>
                    <div className={`tab-indicator ${isLogin ? "left" : "right"}`} />
                </div>

                {/* Sliding Panel */}
                <div className={`auth-panels ${isLogin ? "show-login" : "show-register"}`}>
                    <div className="panel panel-login">
                        <LoginForm onSwitch={() => setIsLogin(false)} />
                    </div>
                    <div className="panel panel-register">
                        <RegisterForm onSwitch={() => setIsLogin(true)} />
                    </div>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="dark"
            />
        </div>
    );
}

export default AdminAuth;