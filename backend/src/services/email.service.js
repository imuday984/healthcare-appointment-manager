const nodemailer = require("nodemailer");

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Validate email configuration
if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn(
        "⚠️ Email configuration is incomplete. " +
        "EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD are required."
    );
}

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,

    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    },

    tls: {
        minVersion: "TLSv1.2"
    }
});


// ==========================================
// GENERIC EMAIL
// ==========================================

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            text
        });

        console.log(`Email sent successfully to ${to}`);

        return true;

    } catch (error) {
        console.error(
            "Email sending failed:",
            error.message
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
    sendDoctorCancellationEmail
};