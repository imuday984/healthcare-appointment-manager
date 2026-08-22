const express = require("express");

const {
    authenticate,
    authorize
} = require("../auth/auth.middleware");

const {
    getPendingDoctors,
    approveDoctor,
    rejectDoctor
} = require("./admin.controller");

const router = express.Router();


// All admin routes require authentication
// and ADMIN role.

router.get(
    "/doctors/pending",
    authenticate,
    authorize("ADMIN"),
    getPendingDoctors
);


router.patch(
    "/doctors/:doctorId/approve",
    authenticate,
    authorize("ADMIN"),
    approveDoctor
);


router.patch(
    "/doctors/:doctorId/reject",
    authenticate,
    authorize("ADMIN"),
    rejectDoctor
);


module.exports = router;