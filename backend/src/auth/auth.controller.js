const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");


// ==========================================
// VALIDATION HELPERS
// ==========================================

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isStrongPassword = (password) => {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
    );
};


// ==========================================
// PATIENT REGISTRATION
// ==========================================

const registerPatient = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body || {};

        // Validate fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and contain uppercase, lowercase and a number"
            });
        }

        // Check existing account
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase().trim()
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create patient
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: "PATIENT",
                accountStatus: "ACTIVE"
            }
        });

        return res.status(201).json({
            message: "Patient account created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        console.error("Patient registration error:", error);

        return res.status(500).json({
            message: "Unable to create patient account"
        });
    }
};


// ==========================================
// DOCTOR REGISTRATION
// ==========================================

const registerDoctor = async (req, res) => {
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

        // Validate required fields
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

        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and contain uppercase, lowercase and a number"
            });
        }

        const duration = Number(slotDuration);

        if (!Number.isInteger(duration) || duration <= 0) {
            return res.status(400).json({
                message: "Slot duration must be a positive number"
            });
        }

        // Check existing account
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase().trim()
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        /*
         * Create User + Doctor atomically.
         *
         * Doctor starts as PENDING and must be
         * approved by an administrator.
         */
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: "DOCTOR",
                accountStatus: "PENDING",

                doctor: {
                    create: {
                        specialization: specialization.trim(),
                        workStartTime,
                        workEndTime,
                        slotDuration: duration
                    }
                }
            },

            include: {
                doctor: true
            }
        });

        return res.status(201).json({
            message:
                "Doctor registration submitted. Your account will be available after admin approval.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        console.error("Doctor registration error:", error);

        return res.status(500).json({
            message: "Unable to create doctor registration"
        });
    }
};


// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase().trim()
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Block pending doctors
        if (
            user.role === "DOCTOR" &&
            user.accountStatus === "PENDING"
        ) {
            return res.status(403).json({
                message:
                    "Your doctor account is awaiting administrator approval"
            });
        }

        // Block rejected accounts
        if (user.accountStatus === "REJECTED") {
            return res.status(403).json({
                message:
                    "Your account registration has been rejected"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Unable to login"
        });
    }
};


module.exports = {
    registerPatient,
    registerDoctor,
    login
};