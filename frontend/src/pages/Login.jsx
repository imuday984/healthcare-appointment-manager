import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await API.post("/auth/login", {
                email: email.trim(),
                password
            });

            console.log("LOGIN RESPONSE:", response.data);

            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error("Invalid login response");
            }

            // Save authentication
            localStorage.setItem("token", token);
            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            console.log("LOGGED IN USER:", user);
            console.log("USER ROLE:", user.role);

            // Redirect based on role
            if (user.role === "PATIENT") {

                navigate("/patient", {
                    replace: true
                });

            } else if (user.role === "DOCTOR") {

                navigate("/doctor", {
                    replace: true
                });

            } else if (user.role === "ADMIN") {

                navigate("/admin", {
                    replace: true
                });

            } else {

                setError(
                    "Unknown account role. Please contact the administrator."
                );
            }

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Login failed. Please check your credentials."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            <div className="login-card">

                <div className="login-logo">
                    +
                </div>

                <h1>
                    Healthcare Appointment Manager
                </h1>

                <p className="login-subtitle">
                    Sign in to manage your healthcare appointments
                </p>


                <form onSubmit={handleLogin}>

                    <label htmlFor="email">
                        Email Address
                    </label>

                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                    />


                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                        required
                    />


                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>


                <p className="register-link">
                    Don't have an account?{" "}

                    <Link to="/register">
                        Create an account
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;