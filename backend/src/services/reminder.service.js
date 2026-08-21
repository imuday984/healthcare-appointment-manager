const cron = require("node-cron");
const prisma = require("../config/prisma");

const { sendEmail } = require("./email.service");

const sentReminders = new Set();

const startReminderService = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const reminderStart = new Date(
                now.getTime() + 14 * 60 * 1000
            );

            const reminderEnd = new Date(
                now.getTime() + 15 * 60 * 1000
            );

            const appointments = await prisma.appointment.findMany({
                where: {
                    startTime: {
                        gte: reminderStart,
                        lt: reminderEnd
                    },
                    status: "BOOKED"
                },
                include: {
                    patient: true,
                    doctor: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            for (const appointment of appointments) {
                const reminderId = `appointment-${appointment.id}`;

                if (sentReminders.has(reminderId)) {
                    continue;
                }

                // Patient reminder
                if (appointment.patient?.email) {
                    await sendEmail(
                        appointment.patient.email,
                        "Appointment Reminder",
                        `Reminder: You have an appointment with Dr. ${
                            appointment.doctor.user.name
                        }.

Appointment time:
${new Date(
    appointment.startTime
).toLocaleString()}

Please be ready for your appointment.`
                    );
                }

                // Doctor reminder
                if (appointment.doctor?.user?.email) {
                    await sendEmail(
                        appointment.doctor.user.email,
                        "Appointment Reminder",
                        `Reminder: You have an appointment with ${
                            appointment.patient.name
                        }.

Appointment time:
${new Date(
    appointment.startTime
).toLocaleString()}`
                    );
                }

                sentReminders.add(reminderId);

                console.log(
                    `Reminder sent for appointment ${appointment.id}`
                );
            }

        } catch (error) {
            console.error(
                "Reminder service error:",
                error.message
            );
        }
    });

    console.log("Appointment reminder service started");
};

module.exports = {
    startReminderService
};