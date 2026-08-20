const express = require("express");

const {
    authenticate,
    authorize
} = require("../auth/auth.middleware");

const {
    createDoctor,
    addLeave,
    getDoctors,
    getAvailableSlots
} = require("./doctor.controller");

const router = express.Router();


// Get all doctors
router.get("/", getDoctors);


// Get available slots
router.get(
    "/:doctorId/slots",
    getAvailableSlots
);


// Create doctor
router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createDoctor
);


// Add doctor leave
router.post(
    "/leave",
    authenticate,
    authorize("ADMIN"),
    addLeave
);


module.exports = router;