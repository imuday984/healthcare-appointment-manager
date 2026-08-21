const express = require("express");

const {
    authenticate,
    authorize
} = require("../auth/auth.middleware");

const {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    cancelAppointment,
    addConsultationNotes,
    addPrescription,
    generateAISummary,
    generateAIPostVisitSummary
} = require("./appointment.controller");

const router = express.Router();


// ==========================================
// PATIENT ROUTES
// ==========================================

// Book appointment
router.post(
    "/",
    authenticate,
    authorize("PATIENT"),
    bookAppointment
);

// Get patient's appointments
router.get(
    "/my",
    authenticate,
    authorize("PATIENT"),
    getMyAppointments
);

// Cancel appointment
router.patch(
    "/:id/cancel",
    authenticate,
    authorize("PATIENT"),
    cancelAppointment
);

// ==========================================
// DOCTOR ROUTES
// ==========================================

// Doctor views appointments
router.get(
    "/doctor",
    authenticate,
    authorize("DOCTOR"),
    getDoctorAppointments
);

// Doctor adds consultation notes
router.patch(
    "/:id/notes",
    authenticate,
    authorize("DOCTOR"),
    addConsultationNotes
);

// Doctor adds prescription
router.patch(
    "/:id/prescription",
    authenticate,
    authorize("DOCTOR"),
    addPrescription
);

// Generate post-visit AI summary
router.post(
    "/:id/post-visit-summary",
    authenticate,
    authorize("DOCTOR"),
    generateAIPostVisitSummary
);


// ==========================================
// AI PATIENT ROUTES
// ==========================================

// Generate pre-visit AI summary
router.post(
    "/:id/ai-summary",
    authenticate,
    authorize("PATIENT"),
    generateAISummary
);


module.exports = router;