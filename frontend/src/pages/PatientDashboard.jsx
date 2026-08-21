import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../dashboard.css";

function PatientDashboard() {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    const [doctorId, setDoctorId] = useState("");
    const [date, setDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [symptoms, setSymptoms] = useState("");

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [calendarLink, setCalendarLink] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    // ==========================================
    // LOAD PATIENT APPOINTMENTS
    // ==========================================
    const loadAppointments = async () => {
        try {
            const response = await API.get("/appointments/my");

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

    // ==========================================
    // LOAD DOCTORS
    // ==========================================
    const loadDoctors = async () => {
        try {
            const response = await API.get("/doctors");

            setDoctors(response.data.doctors || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to load doctors"
            );
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    useEffect(() => {
        loadAppointments();
        loadDoctors();
    }, []);

    // ==========================================
    // LOAD AVAILABLE SLOTS
    // ==========================================
    const loadSlots = async () => {
        if (!doctorId || !date) {
            setSlots([]);
            return;
        }

        try {
            setError("");
            setMessage("");
            setSelectedSlot(null);

            const response = await API.get(
                `/doctors/${doctorId}/slots`,
                {
                    params: {
                        date
                    }
                }
            );

            setSlots(response.data.slots || []);

            if (response.data.message) {
                setMessage(response.data.message);
            }

        } catch (err) {
            console.error(err);

            setSlots([]);

            setError(
                err.response?.data?.message ||
                "Unable to load available slots"
            );
        }
    };

    // ==========================================
    // BOOK APPOINTMENT
    // ==========================================
    const bookAppointment = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setCalendarLink("");

        if (!doctorId) {
            setError("Please select a doctor.");
            return;
        }

        if (!date) {
            setError("Please select a date.");
            return;
        }

        if (!selectedSlot) {
            setError("Please select an available slot.");
            return;
        }

        try {
            setBooking(true);

            const response = await API.post(
                "/appointments",
                {
                    doctorId: Number(doctorId),
                    startTime: selectedSlot.startTime,
                    endTime: selectedSlot.endTime,
                    symptoms: symptoms.trim() || null
                }
            );

            setMessage(
                "Appointment booked successfully!"
            );

            if (response.data.calendarLink) {
                setCalendarLink(
                    response.data.calendarLink
                );
            }

            setSelectedSlot(null);
            setSymptoms("");
            setSlots([]);

            await loadAppointments();

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to book appointment"
            );
        } finally {
            setBooking(false);
        }
    };

    // ==========================================
    // CANCEL APPOINTMENT
    // ==========================================
    const cancelAppointment = async (appointmentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this appointment?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            await API.patch(
                `/appointments/${appointmentId}/cancel`
            );

            setMessage(
                "Appointment cancelled successfully."
            );

            await loadAppointments();

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to cancel appointment"
            );
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================
    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // ==========================================
    // FORMAT TIME
    // ==========================================
    const formatTime = (time) => {
        return new Date(time).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    return (
        <div className="dashboard-page">

            {/* =================================
                HEADER
            ================================= */}

            <header className="dashboard-header">

                <div>
                    <h1>
                        Healthcare Appointment Manager
                    </h1>

                    <p>
                        Welcome, {user.name || "Patient"}
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

                {/* =================================
                    BOOK APPOINTMENT
                ================================= */}

                <section className="booking-section">

                    <div className="page-title">

                        <div>
                            <h2>Book Appointment</h2>

                            <p className="section-description">
                                Select a doctor, date and
                                available time slot.
                            </p>
                        </div>

                    </div>


                    <form
                        className="booking-form"
                        onSubmit={bookAppointment}
                    >

                        {/* DOCTOR */}

                        <div className="form-group">

                            <label>
                                Doctor
                            </label>

                            <select
                                value={doctorId}
                                onChange={(e) => {
                                    setDoctorId(e.target.value);
                                    setSlots([]);
                                    setSelectedSlot(null);
                                    setMessage("");
                                    setError("");
                                }}
                                required
                            >

                                <option value="">
                                    Select a doctor
                                </option>

                                {doctors.map((doctor) => (
                                    <option
                                        key={doctor.id}
                                        value={doctor.id}
                                    >
                                        {doctor.user.name}
                                        {" - "}
                                        {doctor.specialization}
                                    </option>
                                ))}

                            </select>

                        </div>


                        {/* DATE */}

                        <div className="form-group">

                            <label>
                                Appointment Date
                            </label>

                            <input
                                type="date"
                                value={date}
                                min={
                                    new Date()
                                        .toISOString()
                                        .split("T")[0]
                                }
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setSlots([]);
                                    setSelectedSlot(null);
                                    setMessage("");
                                    setError("");
                                }}
                                required
                            />

                        </div>


                        {/* CHECK SLOTS */}

                        <button
                            type="button"
                            className="load-slots-btn"
                            onClick={loadSlots}
                            disabled={!doctorId || !date}
                        >
                            Check Available Slots
                        </button>


                        {/* AVAILABLE SLOTS */}

                        {slots.length > 0 && (

                            <div className="slots-section">

                                <label>
                                    Available Time Slots
                                </label>

                                <div className="slot-grid">

                                    {slots.map((slot) => {

                                        const selected =
                                            selectedSlot?.startTime ===
                                            slot.startTime;

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    slot.startTime
                                                }
                                                className={
                                                    selected
                                                        ? "slot selected"
                                                        : "slot"
                                                }
                                                onClick={() =>
                                                    setSelectedSlot(
                                                        slot
                                                    )
                                                }
                                            >
                                                {formatTime(
                                                    slot.startTime
                                                )}
                                                {" - "}
                                                {formatTime(
                                                    slot.endTime
                                                )}
                                            </button>
                                        );
                                    })}

                                </div>

                            </div>
                        )}


                        {/* NO SLOTS */}

                        {doctorId &&
                            date &&
                            slots.length === 0 && (
                                <p className="no-slots">
                                    No available slots for
                                    this date.
                                </p>
                            )}


                        {/* SYMPTOMS */}

                        <div className="form-group">

                            <label>
                                Symptoms / Reason for Visit
                            </label>

                            <textarea
                                value={symptoms}
                                onChange={(e) =>
                                    setSymptoms(
                                        e.target.value
                                    )
                                }
                                placeholder="Describe your symptoms..."
                            />

                        </div>


                        {/* BOOK */}

                        <button
                            type="submit"
                            className="book-btn"
                            disabled={
                                booking ||
                                !selectedSlot
                            }
                        >
                            {booking
                                ? "Booking..."
                                : "Book Appointment"}
                        </button>

                    </form>


                    {/* SUCCESS */}

                    {message && (
                        <div className="message-card success">
                            {message}
                        </div>
                    )}


                    {/* GOOGLE CALENDAR */}

                    {calendarLink && (

                        <div className="calendar-card">

                            <h3>
                                Appointment Booked
                            </h3>

                            <p>
                                Add this appointment
                                directly to Google Calendar.
                            </p>

                            <a
                                href={calendarLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="calendar-btn"
                            >
                                Add to Google Calendar
                            </a>

                        </div>
                    )}


                    {/* ERROR */}

                    {error && (
                        <div className="message-card error">
                            {error}
                        </div>
                    )}

                </section>


                {/* =================================
                    MY APPOINTMENTS
                ================================= */}

                <section>

                    <div className="page-title">

                        <h2>
                            My Appointments
                        </h2>

                        <span>
                            {appointments.length} appointment
                            {appointments.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>


                    {loading && (
                        <div className="message-card">
                            Loading appointments...
                        </div>
                    )}


                    {!loading &&
                        appointments.length === 0 && (
                            <div className="message-card">
                                You don't have any
                                appointments yet.
                            </div>
                        )}


                    <div className="appointment-grid">

                        {appointments.map(
                            (appointment) => {

                                const doctorName =
                                    appointment.doctor?.user?.name ||
                                    "Doctor";

                                const date =
                                    new Date(
                                        appointment.startTime
                                    );

                                return (

                                    <div
                                        className="appointment-card"
                                        key={appointment.id}
                                    >

                                        {/* CARD HEADER */}

                                        <div className="card-header">

                                            <div>

                                                <h3>
                                                    {doctorName}
                                                </h3>

                                                <p className="specialization">
                                                    {
                                                        appointment
                                                            .doctor
                                                            ?.specialization
                                                    }
                                                </p>

                                            </div>

                                            <span
                                                className={`status ${appointment.status.toLowerCase()}`}
                                            >
                                                {
                                                    appointment.status
                                                }
                                            </span>

                                        </div>


                                        {/* DATE + TIME */}

                                        <div className="appointment-info">

                                            <div>
                                                <span>
                                                    Date
                                                </span>

                                                <strong>
                                                    {date.toLocaleDateString()}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Time
                                                </span>

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


                                        {/* SYMPTOMS */}

                                        {appointment.symptoms && (

                                            <div className="info-section">

                                                <h4>
                                                    Symptoms
                                                </h4>

                                                <p>
                                                    {
                                                        appointment.symptoms
                                                    }
                                                </p>

                                            </div>
                                        )}


                                        {/* NOTES */}

                                        {appointment.notes && (

                                            <div className="info-section">

                                                <h4>
                                                    Consultation Notes
                                                </h4>

                                                <p>
                                                    {
                                                        appointment.notes
                                                    }
                                                </p>

                                            </div>
                                        )}


                                        {/* PRESCRIPTION */}

                                        {appointment.prescription && (

                                            <div className="info-section">

                                                <h4>
                                                    Prescription
                                                </h4>

                                                <p>
                                                    {
                                                        appointment.prescription
                                                    }
                                                </p>

                                            </div>
                                        )}


                                        {/* AI SUMMARY */}

                                        {appointment.aiSummary && (

                                            <div className="info-section ai-section">

                                                <h4>
                                                    AI Health Summary
                                                </h4>

                                                <pre>
                                                    {
                                                        appointment.aiSummary
                                                    }
                                                </pre>

                                            </div>
                                        )}


                                        {/* POST VISIT */}

                                        {appointment.postVisitSummary && (

                                            <div className="info-section ai-section">

                                                <h4>
                                                    Post-Visit Summary
                                                </h4>

                                                <pre>
                                                    {
                                                        appointment.postVisitSummary
                                                    }
                                                </pre>

                                            </div>
                                        )}


                                        {/* CANCEL */}

                                        {appointment.status ===
                                            "BOOKED" && (

                                            <button
                                                className="cancel-btn"
                                                onClick={() =>
                                                    cancelAppointment(
                                                        appointment.id
                                                    )
                                                }
                                            >
                                                Cancel Appointment
                                            </button>

                                        )}

                                    </div>
                                );
                            }
                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}

export default PatientDashboard;