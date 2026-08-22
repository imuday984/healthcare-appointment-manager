const https = require("https");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME =
    process.env.EMAIL_FROM_NAME ||
    "Healthcare Appointment Manager";


// ==========================================
// BREVO API REQUEST
// ==========================================

const sendBrevoEmail = (
    to,
    subject,
    text
) => {
    return new Promise((resolve, reject) => {

        if (!BREVO_API_KEY) {
            return reject(
                new Error("BREVO_API_KEY is not configured")
            );
        }

        if (!EMAIL_FROM) {
            return reject(
                new Error("EMAIL_FROM is not configured")
            );
        }

        const payload = JSON.stringify({
            sender: {
                name: EMAIL_FROM_NAME,
                email: EMAIL_FROM
            },

            to: [
                {
                    email: to
                }
            ],

            subject: subject,

            textContent: text
        });

        const options = {
            hostname: "api.brevo.com",

            path: "/v3/smtp/email",

            method: "POST",

            headers: {
                "accept": "application/json",

                "api-key": BREVO_API_KEY,

                "content-type":
                    "application/json",

                "content-length":
                    Buffer.byteLength(payload)
            },

            timeout: 15000
        };


        const request =
            https.request(
                options,
                (response) => {

                    let data = "";

                    response.on(
                        "data",
                        (chunk) => {
                            data += chunk;
                        }
                    );


                    response.on(
                        "end",
                        () => {

                            console.log(
                                "Brevo API status:",
                                response.statusCode
                            );


                            if (
                                response.statusCode >= 200 &&
                                response.statusCode < 300
                            ) {

                                console.log(
                                    "Email sent successfully to:",
                                    to
                                );

                                console.log(
                                    "Brevo response:",
                                    data
                                );

                                resolve(true);

                            } else {

                                console.error(
                                    "Brevo API email failed"
                                );

                                console.error(
                                    "Status:",
                                    response.statusCode
                                );

                                console.error(
                                    "Response:",
                                    data
                                );

                                resolve(false);
                            }
                        }
                    );
                }
            );


        request.on(
            "timeout",
            () => {

                console.error(
                    "Brevo API request timed out"
                );

                request.destroy();

                resolve(false);
            }
        );


        request.on(
            "error",
            (error) => {

                console.error(
                    "Brevo API request error:",
                    error.message
                );

                resolve(false);
            }
        );


        request.write(payload);

        request.end();
    });
};


// ==========================================
// GENERIC EMAIL
// ==========================================

const sendEmail = async (
    to,
    subject,
    text
) => {

    try {

        console.log(
            "================================="
        );

        console.log(
            "BREVO API EMAIL"
        );

        console.log(
            "To:",
            to
        );

        console.log(
            "Subject:",
            subject
        );

        console.log(
            "From:",
            EMAIL_FROM
        );

        console.log(
            "API Key:",
            BREVO_API_KEY
                ? "SET"
                : "NOT SET"
        );

        console.log(
            "================================="
        );


        const result =
            await sendBrevoEmail(
                to,
                subject,
                text
            );


        console.log(
            "Email result:",
            result
        );


        return result;

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


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    sendEmail,

    sendBookingConfirmation,

    sendDoctorBookingNotification,

    sendCancellationEmail,

    sendDoctorCancellationEmail
};