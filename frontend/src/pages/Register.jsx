import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState("PATIENT");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        specialization: "",
        workStartTime: "09:00",
        workEndTime: "17:00",
        slotDuration: "30"
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (form.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            let response;

            if (accountType === "PATIENT") {
                response = await API.post(
                    "/auth/register/patient",
                    {
                        name: form.name,
                        email: form.email,
                        password: form.password
                    }
                );

                setSuccess(
                    "Patient account created successfully. Redirecting to login..."
                );
            } else {
                response = await API.post(
                    "/auth/register/doctor",
                    {
                        name: form.name,
                        email: form.email,
                        password: form.password,
                        specialization: form.specialization,
                        workStartTime: form.workStartTime,
                        workEndTime: form.workEndTime,
                        slotDuration: Number(form.slotDuration)
                    }
                );

                setSuccess(
                    "Doctor registration submitted successfully. Your account must be approved by an administrator before you can log in."
                );
            }

            setTimeout(() => {
                navigate("/login");
            }, 2500);

        } catch (error) {
        console.error("REGISTRATION ERROR:", error);

    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
    );
} finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                <h1>Healthcare Appointment Manager</h1>

                <p className="register-subtitle">
                    Create your account
                </p>

                {/* Account Type */}
                <div className="account-type">

                    <button
                        type="button"
                        className={
                            accountType === "PATIENT"
                                ? "type-button active"
                                : "type-button"
                        }
                        onClick={() => {
                            setAccountType("PATIENT");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Patient
                    </button>

                    <button
                        type="button"
                        className={
                            accountType === "DOCTOR"
                                ? "type-button active"
                                : "type-button"
                        }
                        onClick={() => {
                            setAccountType("DOCTOR");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Doctor
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* Name */}
                    <label>Full Name</label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    {/* Email */}
                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    {/* Password */}
                    <label>Password</label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Minimum 8 characters"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    {/* Confirm Password */}
                    <label>Confirm Password</label>

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    {/* Doctor fields */}
                    {accountType === "DOCTOR" && (
                        <div className="doctor-fields">

                            <label>Specialization</label>

                            <input
                                type="text"
                                name="specialization"
                                placeholder="e.g. Cardiology"
                                value={form.specialization}
                                onChange={handleChange}
                                required
                            />

                            <div className="time-row">

                                <div>
                                    <label>Working Start</label>

                                    <input
                                        type="time"
                                        name="workStartTime"
                                        value={form.workStartTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Working End</label>

                                    <input
                                        type="time"
                                        name="workEndTime"
                                        value={form.workEndTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>

                            <label>Appointment Slot Duration</label>

                            <select
                                name="slotDuration"
                                value={form.slotDuration}
                                onChange={handleChange}
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                            </select>

                            <p className="doctor-notice">
                                Doctor accounts require administrator approval
                                before they can access the dashboard.
                            </p>

                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="register-success">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : accountType === "PATIENT"
                                ? "Create Patient Account"
                                : "Submit Doctor Registration"}
                    </button>

                </form>

                <p className="login-link">
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;