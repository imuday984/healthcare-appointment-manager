const prisma = require("../config/prisma");
const {
    generateSymptomSummary
} = require("../services/ai.service");

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

        if (!doctorId || !startTime || !endTime) {
            return res.status(400).json({
                message: "Doctor ID, start time and end time are required"
            });
        }

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
                message: "Doctor is on leave on this date"
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

        const appointment = await prisma.appointment.create({
            data: {
                doctorId: Number(doctorId),
                patientId: req.user.userId,
                startTime: start,
                endTime: end,
                status: "BOOKED",
                symptoms: symptoms || null
            }
        });

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        });

    } catch (error) {
        console.error("Booking error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "This slot is already booked"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET PATIENT APPOINTMENTS
// ==========================================
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
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
                startTime: "asc"
            }
        });

        res.status(200).json({
            appointments
        });

    } catch (error) {
        console.error("Get appointments error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET DOCTOR APPOINTMENTS
// ==========================================
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        const appointments = await prisma.appointment.findMany({
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

        res.status(200).json({
            appointments
        });

    } catch (error) {
        console.error("Get doctor appointments error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// CANCEL APPOINTMENT
// ==========================================
const cancelAppointment = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);

        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        if (appointment.patientId !== req.user.userId) {
            return res.status(403).json({
                message: "You cannot cancel this appointment"
            });
        }

        if (appointment.status === "CANCELLED") {
            return res.status(400).json({
                message: "Appointment is already cancelled"
            });
        }

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: "CANCELLED"
                }
            });

        res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error("Cancel appointment error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// ADD CONSULTATION NOTES
// ==========================================
const addConsultationNotes = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);
        const { notes } = req.body || {};

        if (!notes) {
            return res.status(400).json({
                message: "Notes are required"
            });
        }

        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor || doctor.id !== appointment.doctorId) {
            return res.status(403).json({
                message: "You cannot modify this appointment"
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

        res.status(200).json({
            message: "Consultation notes added successfully",
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error("Add notes error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// ADD PRESCRIPTION
// ==========================================
const addPrescription = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);
        const { prescription } = req.body || {};

        if (!prescription) {
            return res.status(400).json({
                message: "Prescription is required"
            });
        }

        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor || doctor.id !== appointment.doctorId) {
            return res.status(403).json({
                message: "You cannot modify this appointment"
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

        res.status(200).json({
            message: "Prescription added successfully",
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error("Prescription error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GENERATE AI PRE-VISIT SUMMARY
// ==========================================
const generateAISummary = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);

        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Only the patient who owns the appointment can use this
        if (appointment.patientId !== req.user.userId) {
            return res.status(403).json({
                message: "You cannot access this appointment"
            });
        }

        if (!appointment.symptoms) {
            return res.status(400).json({
                message: "No symptoms provided"
            });
        }

        // Call OpenAI service
        const summary = await generateSymptomSummary(
            appointment.symptoms
        );

        // AI failure should not break the application
        if (!summary) {
            return res.status(503).json({
                message: "AI service temporarily unavailable"
            });
        }

        // Save AI result
        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    aiSummary: summary
                }
            });

        res.status(200).json({
            message: "AI summary generated successfully",
            summary: updatedAppointment.aiSummary
        });

    } catch (error) {
        console.error("AI summary controller error:", error);

        res.status(500).json({
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
    generateAISummary
};