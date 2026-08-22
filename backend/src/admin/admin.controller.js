const prisma = require("../config/prisma");


// ==========================================
// GET PENDING DOCTORS
// ==========================================

const getPendingDoctors = async (req, res) => {
    try {
        const doctors = await prisma.doctor.findMany({
            where: {
                user: {
                    accountStatus: "PENDING"
                }
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        accountStatus: true,
                        createdAt: true
                    }
                }
            },

            orderBy: {
                user: {
                    createdAt: "desc"
                }
            }
        });

        res.status(200).json({
            doctors
        });

    } catch (error) {
        console.error(
            "Get pending doctors error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// APPROVE DOCTOR
// ==========================================

const approveDoctor = async (req, res) => {
    try {
        const doctorId = Number(req.params.doctorId);

        if (!doctorId) {
            return res.status(400).json({
                message: "Invalid doctor ID"
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            },
            include: {
                user: true
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        if (doctor.user.accountStatus === "ACTIVE") {
            return res.status(400).json({
                message: "Doctor is already approved"
            });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: doctor.userId
            },

            data: {
                accountStatus: "ACTIVE"
            }
        });

        res.status(200).json({
            message: "Doctor approved successfully",

            doctor: {
                id: doctor.id,
                name: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.accountStatus
            }
        });

    } catch (error) {
        console.error(
            "Approve doctor error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// REJECT DOCTOR
// ==========================================

const rejectDoctor = async (req, res) => {
    try {
        const doctorId = Number(req.params.doctorId);

        if (!doctorId) {
            return res.status(400).json({
                message: "Invalid doctor ID"
            });
        }

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

        await prisma.user.update({
            where: {
                id: doctor.userId
            },

            data: {
                accountStatus: "REJECTED"
            }
        });

        res.status(200).json({
            message: "Doctor registration rejected"
        });

    } catch (error) {
        console.error(
            "Reject doctor error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    getPendingDoctors,
    approveDoctor,
    rejectDoctor
};