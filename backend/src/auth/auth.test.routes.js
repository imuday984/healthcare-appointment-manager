const express = require("express");

const {
    authenticate,
    authorize
} = require("./auth.middleware");

const router = express.Router();

router.get("/protected", authenticate, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

router.get(
    "/admin-only",
    authenticate,
    authorize("ADMIN"),
    (req, res) => {
        res.json({
            message: "Welcome Admin"
        });
    }
);

router.get(
    "/doctor-or-admin",
    authenticate,
    authorize("DOCTOR", "ADMIN"),
    (req, res) => {
        res.json({
            message: "Welcome Doctor or Admin"
        });
    }
);

module.exports = router;