const express = require("express");

const {
    registerPatient,
    registerDoctor,
    login
} = require("./auth.controller");

const router = express.Router();


// Patient registration
router.post(
    "/register/patient",
    registerPatient
);


// Doctor registration
router.post(
    "/register/doctor",
    registerDoctor
);


// Login
router.post(
    "/login",
    login
);


module.exports = router;