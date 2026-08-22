const prisma = require("../config/prisma");

const {
    generateSymptomSummary,
    generatePostVisitSummary
} = require("../services/ai.service");

const {
    createCalendarLink
} = require("../services/calendar.service");

const {
    sendBookingConfirmation,
    sendDoctorBookingNotification,
    sendCancellationEmail,
    sendDoctorCancellationEmail
} = require("../services/email.service");


// ==========================================
// BOOK APPOINTMENT
// ==========================================

const bookAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            startTime,
            endTime,
            symptoms
        } = req.body || {};

        // Validate input
        if (!doctorId || !startTime || !endTime) {
            return res.status(400).json({
                message:
                    "Doctor ID, start time and end time are required"
            });
        }

        // Find doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                id: Number(doctorId)
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check doctor leave
        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(start);
        dayEnd.setHours(23, 59, 59, 999);

        const leave = await prisma.doctorLeave.findFirst({
            where: {
                doctorId: Number(doctorId),
                leaveDate: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        if (leave) {
            return res.status(409).json({
                message:
                    "Doctor is on leave on this date"
            });
        }

        // Check existing booking
        const existingAppointment =
            await prisma.appointment.findUnique({
                where: {
                    doctorId_startTime: {
                        doctorId: Number(doctorId),
                        startTime: start
                    }
                }
            });

        if (existingAppointment) {
            return res.status(409).json({
                message: "This slot is already booked"
            });
        }

        // Create appointment
        const appointment =
            await prisma.appointment.create({
                data: {
                    doctorId: Number(doctorId),
                    patientId: req.user.userId,
                    startTime: start,
                    endTime: end,
                    status: "BOOKED",
                    symptoms: symptoms || null
                }
            });

        // ==========================================
        // GET PATIENT DETAILS
        // ==========================================

        const patient = await prisma.user.findUnique({
            where: {
                id: req.user.userId
            }
        });

        // ==========================================
        // GET DOCTOR DETAILS
        // ==========================================

        const doctorDetails =
            await prisma.doctor.findUnique({
                where: {
                    id: Number(doctorId)
                },
                include: {
                    user: true
                }
            });

        // ==========================================
        // SEND BOOKING EMAILS
        // ==========================================

        if (patient && doctorDetails) {

            console.log(
                "================================="
            );

            console.log(
                "STARTING EMAIL NOTIFICATIONS"
            );

            console.log(
                "Patient email:",
                patient.email
            );

            console.log(
                "Doctor email:",
                doctorDetails.user.email
            );

            console.log(
                "EMAIL_HOST:",
                process.env.EMAIL_HOST || "NOT SET"
            );

            console.log(
                "EMAIL_PORT:",
                process.env.EMAIL_PORT || "NOT SET"
            );

            console.log(
                "EMAIL_USER:",
                process.env.EMAIL_USER || "NOT SET"
            );

            console.log(
                "EMAIL_FROM:",
                process.env.EMAIL_FROM || "NOT SET"
            );

            // Never print EMAIL_PASSWORD
            console.log(
                "EMAIL_PASSWORD:",
                process.env.EMAIL_PASSWORD
                    ? "SET"
                    : "NOT SET"
            );

            console.log(
                "================================="
            );


            // ------------------------------------------
            // Patient email
            // ------------------------------------------

            try {

                const patientEmailResult =
                    await sendBookingConfirmation(
                        patient.email,
                        doctorDetails.user.name,
                        appointment.startTime
                    );

                console.log(
                    "Patient email result:",
                    patientEmailResult
                );

            } catch (emailError) {

                console.error(
                    "Patient email exception:",
                    emailError
                );
            }


            // ------------------------------------------
            // Doctor email
            // ------------------------------------------

            try {

                const doctorEmailResult =
                    await sendDoctorBookingNotification(
                        doctorDetails.user.email,
                        patient.name,
                        appointment.startTime
                    );

                console.log(
                    "Doctor email result:",
                    doctorEmailResult
                );

            } catch (emailError) {

                console.error(
                    "Doctor email exception:",
                    emailError
                );
            }


            console.log(
                "================================="
            );

            console.log(
                "EMAIL NOTIFICATIONS FINISHED"
            );

            console.log(
                "================================="
            );
        } else {

            console.warn(
                "Email notifications skipped because patient or doctor details were not found."
            );

            console.warn(
                "Patient exists:",
                Boolean(patient)
            );

            console.warn(
                "Doctor exists:",
                Boolean(doctorDetails)
            );
        }

        // ==========================================
        // CREATE CALENDAR LINK
        // ==========================================

        const calendarLink = createCalendarLink({
            doctorName: doctorDetails.user.name,
            startTime: appointment.startTime,
            endTime: appointment.endTime
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment,
            calendarLink
        });

    } catch (error) {

        console.error(
            "Booking error:",
            error
        );

        // Prisma duplicate booking
        if (error.code === "P2002") {
            return res.status(409).json({
                message:
                    "This slot is already booked"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET PATIENT APPOINTMENTS
// ==========================================

const getMyAppointments = async (req, res) => {
    try {

        const appointments =
            await prisma.appointment.findMany({
                where: {
                    patientId: req.user.userId
                },

                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },

                orderBy: {
                    startTime: "desc"
                }
            });

        return res.status(200).json({
            count: appointments.length,
            appointments
        });

    } catch (error) {

        console.error(
            "Get patient history error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET DOCTOR APPOINTMENTS
// ==========================================

const getDoctorAppointments = async (req, res) => {
    try {

        const doctor =
            await prisma.doctor.findUnique({
                where: {
                    userId: req.user.userId
                }
            });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        const appointments =
            await prisma.appointment.findMany({
                where: {
                    doctorId: doctor.id
                },

                include: {
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },

                orderBy: {
                    startTime: "asc"
                }
            });

        return res.status(200).json({
            appointments
        });

    } catch (error) {

        console.error(
            "Get doctor appointments error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// CANCEL APPOINTMENT
// ==========================================

const cancelAppointment = async (req, res) => {
    try {

        const appointmentId =
            Number(req.params.id);

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Only patient who booked it can cancel
        if (
            appointment.patientId !==
            req.user.userId
        ) {
            return res.status(403).json({
                message:
                    "You cannot cancel this appointment"
            });
        }

        // Prevent cancelling twice
        if (
            appointment.status ===
            "CANCELLED"
        ) {
            return res.status(400).json({
                message:
                    "Appointment is already cancelled"
            });
        }

        // Get patient
        const patient =
            await prisma.user.findUnique({
                where: {
                    id: appointment.patientId
                }
            });

        // Get doctor
        const doctor =
            await prisma.doctor.findUnique({
                where: {
                    id: appointment.doctorId
                },
                include: {
                    user: true
                }
            });

        // Update appointment
        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: "CANCELLED"
                }
            });

        // Send cancellation emails
        if (patient && doctor) {

            await sendCancellationEmail(
                patient.email,
                doctor.user.name,
                appointment.startTime
            );

            await sendDoctorCancellationEmail(
                doctor.user.email,
                patient.name,
                appointment.startTime
            );
        }

        return res.status(200).json({
            message:
                "Appointment cancelled successfully",
            appointment: updatedAppointment
        });

    } catch (error) {

        console.error(
            "Cancel appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// ADD CONSULTATION NOTES
// ==========================================

const addConsultationNotes = async (
    req,
    res
) => {
    try {

        const appointmentId =
            Number(req.params.id);

        const { notes } =
            req.body || {};

        if (!notes) {
            return res.status(400).json({
                message:
                    "Notes are required"
            });
        }

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        const doctor =
            await prisma.doctor.findUnique({
                where: {
                    userId: req.user.userId
                }
            });

        if (
            !doctor ||
            doctor.id !== appointment.doctorId
        ) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    notes
                }
            });

        return res.status(200).json({
            message:
                "Consultation notes added successfully",
            appointment: updatedAppointment
        });

    } catch (error) {

        console.error(
            "Add notes error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// ADD PRESCRIPTION
// ==========================================

const addPrescription = async (
    req,
    res
) => {
    try {

        const appointmentId =
            Number(req.params.id);

        const { prescription } =
            req.body || {};

        if (!prescription) {
            return res.status(400).json({
                message:
                    "Prescription is required"
            });
        }

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        const doctor =
            await prisma.doctor.findUnique({
                where: {
                    userId: req.user.userId
                }
            });

        if (
            !doctor ||
            doctor.id !== appointment.doctorId
        ) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    prescription
                }
            });

        return res.status(200).json({
            message:
                "Prescription added successfully",
            appointment: updatedAppointment
        });

    } catch (error) {

        console.error(
            "Prescription error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GENERATE AI PRE-VISIT SUMMARY
// ==========================================

const generateAISummary = async (
    req,
    res
) => {
    try {

        const appointmentId =
            Number(req.params.id);

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        if (
            appointment.patientId !==
            req.user.userId
        ) {
            return res.status(403).json({
                message:
                    "You cannot access this appointment"
            });
        }

        if (!appointment.symptoms) {
            return res.status(400).json({
                message:
                    "No symptoms provided"
            });
        }

        const summary =
            await generateSymptomSummary(
                appointment.symptoms
            );

        if (!summary) {
            return res.status(503).json({
                message:
                    "AI service temporarily unavailable"
            });
        }

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    aiSummary: summary
                }
            });

        return res.status(200).json({
            message:
                "AI summary generated successfully",
            summary:
                updatedAppointment.aiSummary
        });

    } catch (error) {

        console.error(
            "AI summary controller error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GENERATE AI POST-VISIT SUMMARY
// ==========================================

const generateAIPostVisitSummary = async (
    req,
    res
) => {
    try {

        const appointmentId =
            Number(req.params.id);

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        const doctor =
            await prisma.doctor.findUnique({
                where: {
                    userId: req.user.userId
                }
            });

        if (
            !doctor ||
            doctor.id !== appointment.doctorId
        ) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        if (!appointment.notes) {
            return res.status(400).json({
                message:
                    "Consultation notes are required"
            });
        }

        const summary =
            await generatePostVisitSummary(
                appointment.notes,
                appointment.prescription
            );

        if (!summary) {
            return res.status(503).json({
                message:
                    "AI service temporarily unavailable"
            });
        }

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    postVisitSummary: summary,
                    status: "COMPLETED"
                }
            });

        return res.status(200).json({
            message:
                "Post-visit AI summary generated successfully",
            summary:
                updatedAppointment.postVisitSummary
        });

    } catch (error) {

        console.error(
            "Post-visit AI summary error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    cancelAppointment,
    addConsultationNotes,
    addPrescription,
    generateAISummary,
    generateAIPostVisitSummary
};