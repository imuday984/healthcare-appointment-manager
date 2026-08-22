const nodemailer = require("nodemailer");

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

console.log("=================================");
console.log("EMAIL SERVICE INITIALIZED");
console.log("EMAIL_HOST:", EMAIL_HOST || "NOT SET");
console.log("EMAIL_PORT:", EMAIL_PORT);
console.log("EMAIL_USER:", EMAIL_USER || "NOT SET");
console.log("EMAIL_FROM:", EMAIL_FROM || "NOT SET");
console.log(
    "EMAIL_PASSWORD:",
    EMAIL_PASSWORD ? "SET" : "NOT SET"
);
console.log("=================================");

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false,

    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,

    tls: {
        minVersion: "TLSv1.2"
    }
});


// ==========================================
// VERIFY SMTP CONNECTION
// ==========================================

const verifyEmailConnection = async () => {
    try {
        console.log("Testing SMTP connection...");

        await transporter.verify();

        console.log(
            "SMTP connection verified successfully."
        );

        return true;

    } catch (error) {

        console.error(
            "SMTP connection verification failed:"
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "Response:",
            error.response
        );

        console.error(
            "Message:",
            error.message
        );

        return false;
    }
};


// ==========================================
// SEND EMAIL
// ==========================================

const sendEmail = async (
    to,
    subject,
    text
) => {

    console.log("=================================");
    console.log("ATTEMPTING TO SEND EMAIL");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("SMTP Host:", EMAIL_HOST);
    console.log("SMTP Port:", EMAIL_PORT);
    console.log("SMTP User:", EMAIL_USER);
    console.log("=================================");

    try {

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            text
        });

        console.log(
            "EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            "Message ID:",
            info.messageId
        );

        console.log(
            "Accepted:",
            info.accepted
        );

        console.log(
            "Rejected:",
            info.rejected
        );

        console.log(
            "Response:",
            info.response
        );

        console.log(
            "================================="
        );

        return true;

    } catch (error) {

        console.error(
            "EMAIL SENDING FAILED"
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "Response:",
            error.response
        );

        console.error(
            "Response Code:",
            error.responseCode
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Full Error:",
            error
        );

        console.error(
            "================================="
        );

        return false;
    }
};


// ==========================================
// PATIENT — BOOKING CONFIRMATION
// ==========================================

const sendBookingConfirmation = async (
    email,
    doctorName,
    startTime
) => {

    return sendEmail(
        email,
        "Appointment Booking Confirmation",
        `Your appointment with Dr. ${doctorName} has been booked successfully.

Appointment time:
${new Date(startTime).toLocaleString()}

Thank you.`
    );
};


// ==========================================
// DOCTOR — NEW APPOINTMENT
// ==========================================

const sendDoctorBookingNotification = async (
    email,
    patientName,
    startTime
) => {

    return sendEmail(
        email,
        "New Appointment Booked",
        `A new appointment has been booked.

Patient:
${patientName}

Appointment time:
${new Date(startTime).toLocaleString()}`
    );
};


// ==========================================
// PATIENT — CANCELLATION
// ==========================================

const sendCancellationEmail = async (
    email,
    doctorName,
    startTime
) => {

    return sendEmail(
        email,
        "Appointment Cancelled",
        `Your appointment with Dr. ${doctorName} scheduled for:

${new Date(startTime).toLocaleString()}

has been cancelled.`
    );
};


// ==========================================
// DOCTOR — CANCELLATION
// ==========================================

const sendDoctorCancellationEmail = async (
    email,
    patientName,
    startTime
) => {

    return sendEmail(
        email,
        "Appointment Cancelled",
        `An appointment has been cancelled.

Patient:
${patientName}

Appointment time:
${new Date(startTime).toLocaleString()}`
    );
};


module.exports = {
    sendEmail,
    sendBookingConfirmation,
    sendDoctorBookingNotification,
    sendCancellationEmail,
    sendDoctorCancellationEmail,
    verifyEmailConnection
};