import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../dashboard.css";

function DoctorDashboard() {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [notes, setNotes] = useState({});
    const [prescriptions, setPrescriptions] = useState({});
    const [message, setMessage] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadAppointments = async () => {
        try {
            const response =
                await API.get("/appointments/doctor");

            setAppointments(
                response.data.appointments || []
            );
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.clear();
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Unable to load appointments"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const addNotes = async (appointmentId) => {
        try {
            await API.patch(
                `/appointments/${appointmentId}/notes`,
                {
                    notes: notes[appointmentId] || ""
                }
            );

            setMessage("Consultation notes saved successfully.");
            await loadAppointments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save notes"
            );
        }
    };

    const addPrescription = async (appointmentId) => {
        try {
            await API.patch(
                `/appointments/${appointmentId}/prescription`,
                {
                    prescription:
                        prescriptions[appointmentId] || ""
                }
            );

            setMessage("Prescription saved successfully.");
            await loadAppointments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save prescription"
            );
        }
    };

    const generatePostVisitSummary = async (appointmentId) => {
        try {
            setMessage("Generating AI summary...");

            await API.post(`/appointments/${appointment.id}/post-visit-summary`);

            setMessage(
                "AI post-visit summary generated successfully."
            );

            await loadAppointments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to generate AI summary"
            );
        }
    };

    return (
        <div className="dashboard-page">

            <header className="dashboard-header">

                <div>
                    <h1>Healthcare Appointment Manager</h1>

                    <p>
                        Welcome, {user.name || "Doctor"}
                    </p>
                </div>

                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    Logout
                </button>

            </header>

            <main className="dashboard-content">

                <div className="page-title">

                    <h2>Doctor Appointments</h2>

                    <span>
                        {appointments.length} appointment
                        {appointments.length !== 1
                            ? "s"
                            : ""}
                    </span>

                </div>

                {message && (
                    <div className="message-card">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="message-card error">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="message-card">
                        Loading appointments...
                    </div>
                )}

                {!loading &&
                    appointments.length === 0 && (
                        <div className="message-card">
                            No appointments found.
                        </div>
                    )}

                <div className="appointment-grid">

                    {appointments.map((appointment) => {

                        const date = new Date(
                            appointment.startTime
                        );

                        return (
                            <div
                                className="appointment-card"
                                key={appointment.id}
                            >

                                <div className="card-header">

                                    <div>

                                        <h3>
                                            {appointment.patient?.name ||
                                                "Patient"}
                                        </h3>

                                        <p className="specialization">
                                            {appointment.patient?.email}
                                        </p>

                                    </div>

                                    <span
                                        className={`status ${appointment.status.toLowerCase()}`}
                                    >
                                        {appointment.status}
                                    </span>

                                </div>

                                <div className="appointment-info">

                                    <div>
                                        <span>Date</span>

                                        <strong>
                                            {date.toLocaleDateString()}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Time</span>

                                        <strong>
                                            {date.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                {/* Symptoms */}

                                {appointment.symptoms && (
                                    <div className="info-section">

                                        <h4>
                                            Patient Symptoms
                                        </h4>

                                        <p>
                                            {appointment.symptoms}
                                        </p>

                                    </div>
                                )}


                                {/* Consultation Notes */}

                                <div className="info-section">

                                    <h4>
                                        Consultation Notes
                                    </h4>

                                    <textarea
                                        placeholder={
                                            appointment.notes ||
                                            "Enter consultation notes..."
                                        }
                                        value={
                                            notes[
                                                appointment.id
                                            ] ??
                                            appointment.notes ??
                                            ""
                                        }
                                        onChange={(e) =>
                                            setNotes({
                                                ...notes,
                                                [appointment.id]:
                                                    e.target.value
                                            })
                                        }
                                    />

                                    <button
                                        className="action-btn"
                                        onClick={() =>
                                            addNotes(
                                                appointment.id
                                            )
                                        }
                                    >
                                        Save Notes
                                    </button>

                                </div>


                                {/* Prescription */}

                                <div className="info-section">

                                    <h4>
                                        Prescription
                                    </h4>

                                    <textarea
                                        placeholder={
                                            appointment.prescription ||
                                            "Enter prescription..."
                                        }
                                        value={
                                            prescriptions[
                                                appointment.id
                                            ] ??
                                            appointment.prescription ??
                                            ""
                                        }
                                        onChange={(e) =>
                                            setPrescriptions({
                                                ...prescriptions,
                                                [appointment.id]:
                                                    e.target.value
                                            })
                                        }
                                    />

                                    <button
                                        className="action-btn"
                                        onClick={() =>
                                            addPrescription(
                                                appointment.id
                                            )
                                        }
                                    >
                                        Save Prescription
                                    </button>

                                </div>


                                {/* Existing AI summary */}

                                {appointment.aiSummary && (
                                    <div className="info-section ai-section">

                                        <h4>
                                            AI Pre-Visit Summary
                                        </h4>

                                        <pre>
                                            {
                                                appointment.aiSummary
                                            }
                                        </pre>

                                    </div>
                                )}


                                {/* Post Visit Summary */}

                                {appointment.postVisitSummary && (
                                    <div className="info-section ai-section">

                                        <h4>
                                            AI Post-Visit Summary
                                        </h4>

                                        <pre>
                                            {
                                                appointment.postVisitSummary
                                            }
                                        </pre>

                                    </div>
                                )}


                                {/* Generate AI Summary */}

                                {appointment.status !==
                                    "CANCELLED" && (
                                    <button
                                        className="ai-btn"
                                        onClick={() =>
                                            generatePostVisitSummary(
                                                appointment.id
                                            )
                                        }
                                    >
                                        Generate AI Post-Visit Summary
                                    </button>
                                )}

                            </div>
                        );
                    })}

                </div>

            </main>
        </div>
    );
}

export default DoctorDashboard;