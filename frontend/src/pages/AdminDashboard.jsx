import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "ADMIN") {
                navigate("/login", { replace: true });
                return;
            }

            fetchPendingDoctors();

        } catch (err) {
            console.error(err);

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login", { replace: true });
        }
    }, [navigate]);


    // ==========================================
    // GET PENDING DOCTORS
    // ==========================================

    const fetchPendingDoctors = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(
                "/admin/doctors/pending"
            );

            setDoctors(
                response.data.doctors || []
            );

        } catch (err) {
            console.error(
                "Fetch doctors error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load pending doctor registrations."
            );

        } finally {
            setLoading(false);
        }
    };


    // ==========================================
    // APPROVE DOCTOR
    // ==========================================

    const handleApprove = async (doctorId) => {
        try {
            setActionLoading(doctorId);
            setError("");

            await API.patch(
                `/admin/doctors/${doctorId}/approve`
            );

            setDoctors((currentDoctors) =>
                currentDoctors.filter(
                    (doctor) =>
                        doctor.id !== doctorId
                )
            );

        } catch (err) {
            console.error(
                "Approve doctor error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to approve doctor."
            );

        } finally {
            setActionLoading(null);
        }
    };


    // ==========================================
    // REJECT DOCTOR
    // ==========================================

    const handleReject = async (doctorId) => {
        const confirmed = window.confirm(
            "Are you sure you want to reject this doctor registration?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(doctorId);
            setError("");

            await API.patch(
                `/admin/doctors/${doctorId}/reject`
            );

            setDoctors((currentDoctors) =>
                currentDoctors.filter(
                    (doctor) =>
                        doctor.id !== doctorId
                )
            );

        } catch (err) {
            console.error(
                "Reject doctor error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to reject doctor."
            );

        } finally {
            setActionLoading(null);
        }
    };


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
            replace: true
        });
    };


    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="admin-page">

            {/* HEADER */}

            <header className="admin-header">

                <div className="admin-brand">

                    <div className="admin-brand-icon">
                        +
                    </div>

                    <div>
                        <h1>
                            Healthcare Appointment Manager
                        </h1>

                        <p>
                            Administration Portal
                        </p>
                    </div>

                </div>


                <button
                    className="admin-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </header>


            {/* MAIN */}

            <main className="admin-content">

                <div className="admin-heading">

                    <div>

                        <span className="admin-label">
                            ADMINISTRATION
                        </span>

                        <h2>
                            Admin Dashboard
                        </h2>

                        <p>
                            Review and manage doctor registration
                            requests.
                        </p>

                    </div>


                    <div className="pending-counter">

                        <strong>
                            {doctors.length}
                        </strong>

                        <span>
                            Pending
                        </span>

                    </div>

                </div>


                {/* ERROR */}

                {error && (
                    <div className="admin-error">
                        {error}
                    </div>
                )}


                {/* LOADING */}

                {loading && (
                    <div className="admin-state">

                        <div className="loading-spinner"></div>

                        <h3>
                            Loading registrations...
                        </h3>

                        <p>
                            Please wait while we retrieve
                            pending doctor applications.
                        </p>

                    </div>
                )}


                {/* EMPTY */}

                {!loading && doctors.length === 0 && (
                    <div className="admin-state">

                        <div className="success-icon">
                            ✓
                        </div>

                        <h3>
                            All caught up!
                        </h3>

                        <p>
                            There are no doctor registrations
                            waiting for approval.
                        </p>

                        <button
                            className="refresh-button"
                            onClick={fetchPendingDoctors}
                        >
                            Refresh
                        </button>

                    </div>
                )}


                {/* DOCTORS */}

                {!loading && doctors.length > 0 && (

                    <div className="doctor-grid">

                        {doctors.map((doctor) => (

                            <div
                                className="doctor-card"
                                key={doctor.id}
                            >

                                {/* CARD HEADER */}

                                <div className="doctor-card-header">

                                    <div className="doctor-avatar">
                                        {doctor.user.name
                                            ?.charAt(0)
                                            ?.toUpperCase()}
                                    </div>

                                    <div className="doctor-title">

                                        <h3>
                                            Dr.{" "}
                                            {doctor.user.name}
                                        </h3>

                                        <span>
                                            {doctor.specialization}
                                        </span>

                                    </div>

                                    <span className="pending-badge">
                                        PENDING
                                    </span>

                                </div>


                                {/* DETAILS */}

                                <div className="doctor-details">

                                    <div className="detail-item">

                                        <span className="detail-label">
                                            Email
                                        </span>

                                        <strong>
                                            {doctor.user.email}
                                        </strong>

                                    </div>


                                    <div className="detail-row">

                                        <div className="detail-item">

                                            <span className="detail-label">
                                                Working Hours
                                            </span>

                                            <strong>
                                                {doctor.workStartTime}
                                                {" - "}
                                                {doctor.workEndTime}
                                            </strong>

                                        </div>


                                        <div className="detail-item">

                                            <span className="detail-label">
                                                Slot Duration
                                            </span>

                                            <strong>
                                                {doctor.slotDuration}
                                                {" minutes"}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* ACTIONS */}

                                <div className="doctor-actions">

                                    <button
                                        className="approve-button"
                                        disabled={
                                            actionLoading ===
                                            doctor.id
                                        }
                                        onClick={() =>
                                            handleApprove(
                                                doctor.id
                                            )
                                        }
                                    >
                                        {actionLoading ===
                                        doctor.id
                                            ? "Processing..."
                                            : "✓ Approve"}
                                    </button>


                                    <button
                                        className="reject-button"
                                        disabled={
                                            actionLoading ===
                                            doctor.id
                                        }
                                        onClick={() =>
                                            handleReject(
                                                doctor.id
                                            )
                                        }
                                    >
                                        ✕ Reject
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </main>

        </div>
    );
}

export default AdminDashboard;