# Healthcare Appointment Manager

A full-stack healthcare appointment management platform connecting
**patients, doctors, and administrators** through a single web
application.

It supports registration/login, role-based access, doctor approval,
appointment scheduling, doctor availability and leave management,
consultation notes, prescriptions, AI-powered summaries using Google
Gemini, automated email notifications using the Brevo HTTPS API, and
cloud deployment.

## Live Application

**Frontend:**
https://healthcare-appointment-manager-red.vercel.app/login

**Backend API:**
https://healthcare-appointment-manager-api-nalf.onrender.com/

## Roles

  -----------------------------------------------------------------------
  Role                                Capabilities
  ----------------------------------- -----------------------------------
  Patient                             Register/login, find doctors,
                                      book/cancel appointments, enter
                                      symptoms, generate pre-visit AI
                                      summaries, view prescriptions and
                                      post-visit summaries

  Doctor                              Register/login, manage
                                      appointments, add consultation
                                      notes, add prescriptions, generate
                                      post-visit AI summaries

  Admin                               Login, manage users/doctors,
                                      approve doctors, monitor the
                                      platform
  -----------------------------------------------------------------------

## Demo Admin Account

``` text
Email: admin@healthcare.com
Password: Admin@12345
Role: ADMIN
```

**Security:** These are demo credentials for the current project. Change
the password for any real deployment and never publish real production
administrator credentials.

## Architecture

``` text
React + Vite Frontend
        │
        │ HTTPS / REST API
        ▼
Node.js + Express Backend
        │
        ├──────────────► PostgreSQL + Prisma
        │
        ├──────────────► Google Gemini
        │
        └──────────────► Brevo HTTPS Email API
```

### Deployment

-   Frontend: Vercel
-   Backend: Render
-   Database: PostgreSQL
-   AI: Google Gemini
-   Email: Brevo Transactional Email API

## Technology Stack

### Frontend

-   React
-   Vite
-   React Router
-   Axios
-   CSS

### Backend

-   Node.js
-   Express.js
-   JWT
-   bcryptjs
-   Prisma
-   PostgreSQL
-   Google Gemini (`@google/genai`)
-   node-cron
-   Google Calendar integration
-   Brevo API

## Project Structure

``` text
healthcare-appointment-manager/
│
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── PatientDashboard.jsx
│   │       ├── DoctorDashboard.jsx
│   │       └── AdminDashboard.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── auth/
│   │   ├── appointment/
│   │   └── services/
│   │       ├── ai.service.js
│   │       ├── calendar.service.js
│   │       ├── email.service.js
│   │       └── reminder.service.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── README.md
```

## Complete Project Workflow

### Patient

1.  Registers an account.
2.  Logs in.
3.  Views available doctors.
4.  Selects a doctor, date, and time slot.
5.  Enters symptoms and books an appointment.
6.  The appointment is stored in PostgreSQL.
7.  A pre-visit AI summary can be generated from the symptoms.
8.  The patient can view appointment status, consultation notes,
    prescription, and post-visit summary.
9.  The patient can cancel a booked appointment.

### Doctor

1.  Registers as a doctor.
2.  Admin approves the doctor.
3.  Doctor logs in to the doctor dashboard.
4.  Views scheduled appointments.
5.  Adds consultation notes.
6.  Adds a prescription.
7.  Generates an AI post-visit summary from the consultation notes and
    prescription.
8.  The appointment becomes `COMPLETED`.
9.  The patient can then see the post-visit information.

### Admin

The administrator manages the platform and doctor approval process
through the Admin Dashboard.

## Authentication

Authentication uses JWT.

``` text
Email + Password
       ↓
Backend validates credentials
       ↓
bcrypt password comparison
       ↓
JWT generated
       ↓
Frontend stores token
       ↓
Token attached to protected API requests
```

Supported roles:

``` text
PATIENT
DOCTOR
ADMIN
```

Role-based middleware prevents users from accessing routes belonging to
other roles.

## Database

The PostgreSQL database is managed through Prisma.

Main models:

``` text
User
Doctor
DoctorLeave
Appointment
```

### User

Stores name, email, hashed password, role, and creation date.

### Doctor

Stores doctor profile information such as specialization, working hours,
and slot duration.

### DoctorLeave

Stores doctor leave dates and optional reasons.

### Appointment

Stores:

-   Doctor
-   Patient
-   Start/end time
-   Status
-   Symptoms
-   Consultation notes
-   Prescription
-   AI pre-visit summary
-   AI post-visit summary

A unique constraint prevents two appointments for the same doctor and
start time.

## AI Features

Google Gemini is used for two features.

### Pre-Visit AI Summary

``` text
Patient symptoms
      ↓
Backend
      ↓
Gemini
      ↓
AI summary
      ↓
Appointment.aiSummary
```

### Post-Visit AI Summary

``` text
Consultation notes + Prescription
             ↓
           Gemini
             ↓
      Post-visit summary
             ↓
    Appointment.postVisitSummary
             ↓
       Patient dashboard
```

The AI is an assistance/summarization feature and does not replace
professional medical judgment.

## Email System

The production system uses the **Brevo HTTPS API**.

Originally, Nodemailer SMTP was used. During Render deployment, SMTP
connections timed out because the production environment restricted
outbound SMTP ports. The application was therefore changed to use Brevo
over HTTPS.

Current flow:

``` text
Render Backend
      ↓ HTTPS
Brevo API
      ↓
Patient / Doctor email
```

Emails include:

-   Patient booking confirmation
-   Doctor new-appointment notification
-   Patient cancellation notification
-   Doctor cancellation notification

Email processing runs in the background so a slow email provider cannot
keep an appointment stuck in `Booking...`.

## Important API Routes

### Authentication

``` http
POST /api/auth/register
POST /api/auth/login
```

### Patient

``` http
POST  /api/appointments
GET   /api/appointments/my
PATCH /api/appointments/:id/cancel
POST  /api/appointments/:id/ai-summary
```

### Doctor

``` http
GET   /api/appointments/doctor
PATCH /api/appointments/:id/notes
PATCH /api/appointments/:id/prescription
POST  /api/appointments/:id/post-visit-summary
```

Protected routes require JWT authentication and the appropriate role.

## Environment Variables

Create `backend/.env` locally:

``` env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_verified_sender@example.com
EMAIL_FROM_NAME=Healthcare Appointment Manager
```

Never commit `.env` or API keys to GitHub.

## Local Setup

### Backend

``` bash
cd backend
npm install
npx prisma generate
npm start
```

Backend:

``` text
http://localhost:5000
```

### Frontend

``` bash
cd frontend
npm install
npm run dev
```

Frontend:

``` text
http://localhost:5173
```

## Production Deployment

### Frontend --- Vercel

``` text
https://healthcare-appointment-manager-red.vercel.app
```

### Backend --- Render

``` text
https://healthcare-appointment-manager-api-nalf.onrender.com
```

Production environment variables are configured in Render.

### Database

Production uses PostgreSQL rather than the local pgAdmin/PostgreSQL
instance.

### Email

Production email delivery uses Brevo's HTTPS API.

### AI

Production AI requests use Google Gemini.

## Security

The project implements:

-   JWT authentication
-   bcrypt password hashing
-   Role-based authorization
-   Protected API routes
-   Environment variables for secrets
-   Patient/doctor ownership validation
-   Duplicate appointment protection
-   No plain-text password storage
-   HTTPS-based transactional email
-   Production secrets kept outside source control

For a real healthcare deployment, additional privacy, compliance, audit,
encryption, access-control, monitoring, and data-retention requirements
would be necessary.

## Testing Checklist

### Authentication

-   [ ] Patient registration
-   [ ] Doctor registration
-   [ ] Admin login
-   [ ] Invalid credentials
-   [ ] Role-based redirects

### Patient

-   [ ] View doctors
-   [ ] Book appointment
-   [ ] Prevent duplicate slots
-   [ ] Generate pre-visit AI summary
-   [ ] View appointment history
-   [ ] Cancel appointment

### Doctor

-   [ ] View appointments
-   [ ] Add consultation notes
-   [ ] Add prescription
-   [ ] Generate post-visit AI summary
-   [ ] Complete appointment

### Admin

-   [ ] Login
-   [ ] Manage users
-   [ ] Approve doctors

### Notifications

-   [ ] Patient booking email
-   [ ] Doctor booking email
-   [ ] Patient cancellation email
-   [ ] Doctor cancellation email

### Production

-   [ ] Vercel frontend
-   [ ] Render backend
-   [ ] PostgreSQL
-   [ ] Gemini API
-   [ ] Brevo API
-   [ ] Environment variables
-   [ ] CORS
-   [ ] HTTPS

## Future Improvements

-   Refresh-token authentication
-   Password reset
-   Multi-factor authentication
-   Doctor/patient profile management
-   Medical document uploads
-   Prescription PDF generation
-   Advanced admin analytics
-   Appointment reminders
-   Calendar synchronization
-   Doctor search and filtering
-   Pagination
-   Audit logging
-   Rate limiting
-   Stronger input validation
-   Production monitoring and error tracking

## Disclaimer

This is an educational/software engineering project. It is not intended
to replace professional medical systems or clinical decision-making.

AI-generated summaries are informational and must be reviewed by
qualified healthcare professionals.

## Author

**Uday Vardhan Singh Rathore**\
Electrical and Computer Science Engineering, VIT Chennai

Interests include software development, full-stack development, backend
development, AI/ML, and Data Structures & Algorithms.

## Project Summary

Healthcare Appointment Manager demonstrates a complete modern full-stack
workflow:

``` text
Patients
   ↕
Appointments
   ↕
Doctors
   ↕
Admin
   │
   ├── PostgreSQL / Prisma
   ├── Google Gemini AI
   ├── Brevo Email API
   └── Cloud deployment
```

The project combines authentication, role-based authorization,
relational database design, REST APIs, appointment scheduling, AI
integration, transactional email, and cloud deployment into one
production-style application.
