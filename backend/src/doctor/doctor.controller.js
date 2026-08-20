const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// Create a doctor
const createDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            specialization,
            workStartTime,
            workEndTime,
            slotDuration
        } = req.body || {};

        if (
            !name ||
            !email ||
            !password ||
            !specialization ||
            !workStartTime ||
            !workEndTime ||
            !slotDuration
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "DOCTOR",

                doctor: {
                    create: {
                        specialization,
                        workStartTime,
                        workEndTime,
                        slotDuration: Number(slotDuration)
                    }
                }
            },
            include: {
                doctor: true
            }
        });

        res.status(201).json({
            message: "Doctor created successfully",
            doctor: {
                id: doctor.doctor.id,
                userId: doctor.id,
                name: doctor.name,
                email: doctor.email,
                specialization: doctor.doctor.specialization,
                workStartTime: doctor.doctor.workStartTime,
                workEndTime: doctor.doctor.workEndTime,
                slotDuration: doctor.doctor.slotDuration
            }
        });

    } catch (error) {
        console.error("Create doctor error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Add doctor leave
const addLeave = async (req, res) => {
    try {
        const { doctorId, leaveDate, reason } = req.body || {};

        if (!doctorId || !leaveDate) {
            return res.status(400).json({
                message: "Doctor ID and leave date are required"
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

        const leave = await prisma.doctorLeave.create({
            data: {
                doctorId: Number(doctorId),
                leaveDate: new Date(leaveDate),
                reason: reason || null
            }
        });

        res.status(201).json({
            message: "Leave added successfully",
            leave
        });

    } catch (error) {
        console.error("Add leave error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Doctor already has leave on this date"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get all doctors
const getDoctors = async (req, res) => {
    try {
        const doctors = await prisma.doctor.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json({
            doctors
        });

    } catch (error) {
        console.error("Get doctors error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get available slots for a doctor
const getAvailableSlots = async (req, res) => {
    try {
        const doctorId = Number(req.params.doctorId);
        const { date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({
                message: "Doctor ID and date are required"
            });
        }

        // Get doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // Create start and end of requested day
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59`);

        // Check doctor leave
        const leave = await prisma.doctorLeave.findFirst({
            where: {
                doctorId,
                leaveDate: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        if (leave) {
            return res.status(200).json({
                date,
                doctorId,
                message: "Doctor is on leave",
                slots: []
            });
        }

        // Get appointments for this day
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                startTime: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        // Convert booked times into strings for easy comparison
        const bookedSlots = appointments.map((appointment) =>
            appointment.startTime.getTime()
        );

        const slots = [];

        // Convert working hours to minutes
        const [startHour, startMinute] =
            doctor.workStartTime.split(":").map(Number);

        const [endHour, endMinute] =
            doctor.workEndTime.split(":").map(Number);

        let currentMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        // Generate slots
        while (currentMinutes + doctor.slotDuration <= endMinutes) {
            const hour = Math.floor(currentMinutes / 60);
            const minute = currentMinutes % 60;

            const startTime = new Date(
                `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
            );

            const endSlotMinutes =
                currentMinutes + doctor.slotDuration;

            const endHourSlot = Math.floor(endSlotMinutes / 60);
            const endMinuteSlot = endSlotMinutes % 60;

            const endTime = new Date(
                `${date}T${String(endHourSlot).padStart(2, "0")}:${String(endMinuteSlot).padStart(2, "0")}:00`
            );

            // Only include slot if it isn't booked
            if (!bookedSlots.includes(startTime.getTime())) {
                slots.push({
                    startTime,
                    endTime
                });
            }

            currentMinutes += doctor.slotDuration;
        }

        res.status(200).json({
            doctorId,
            date,
            slots
        });

    } catch (error) {
        console.error("Get available slots error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createDoctor,
    addLeave,
    getDoctors,
    getAvailableSlots
};