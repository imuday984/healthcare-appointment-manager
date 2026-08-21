const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text
        });

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error("Email sending failed:", error.message);
        return false;
    }
};


// PATIENT — booking confirmation
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


// DOCTOR — new appointment
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


// PATIENT — cancellation
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


// DOCTOR — cancellation
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