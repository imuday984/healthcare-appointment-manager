const { google } = require("googleapis");

const createCalendarLink = ({
    doctorName,
    startTime,
    endTime
}) => {
    const start = new Date(startTime)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");

    const end = new Date(endTime)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");

    const title = encodeURIComponent(
        `Doctor Appointment - ${doctorName}`
    );

    const details = encodeURIComponent(
        "Healthcare Appointment Manager appointment"
    );

    const dates = `${start}/${end}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
};

module.exports = {
    createCalendarLink
};