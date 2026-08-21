require("dotenv").config();

const transporter = require("./email.service");

const nodemailer = require("nodemailer");

const testTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function testEmail() {
    try {
        await testTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_FROM,
            subject: "Healthcare Appointment Manager Test",
            text: "Email system is working successfully!"
        });

        console.log("TEST EMAIL SENT SUCCESSFULLY");
    } catch (error) {
        console.error("TEST EMAIL FAILED:", error);
    }
}

testEmail();