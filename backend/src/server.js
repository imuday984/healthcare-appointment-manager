const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./auth/auth.routes");
const authTestRoutes = require("./auth/auth.test.routes");
const doctorRoutes = require("./doctor/doctor.routes");
const appointmentRoutes = require("./appointment/appointment.routes");
const { startReminderService } = require("./services/reminder.service");
const adminRoutes = require("./admin/admin.routes");


const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://healthcare-appointment-manager-red.vercel.app"
        ],
        credentials: true
    })
);
app.use(express.json());
app.use("/api/auth", authTestRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Healthcare Appointment Manager API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);

    startReminderService();
});