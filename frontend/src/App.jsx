import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children, role }) {

    const token = localStorage.getItem("token");
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    // No login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (role && user.role !== role) {

        if (user.role === "PATIENT") {
            return (
                <Navigate
                    to="/patient"
                    replace
                />
            );
        }

        if (user.role === "DOCTOR") {
            return (
                <Navigate
                    to="/doctor"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


// ==========================================
// APP
// ==========================================

function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* ==========================
                    LOGIN
                ========================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* ==========================
                    PATIENT
                ========================== */}

                <Route
                    path="/patient"
                    element={
                        <ProtectedRoute role="PATIENT">
                            <PatientDashboard />
                        </ProtectedRoute>
                    }
                />


                {/* ==========================
                    DOCTOR
                ========================== */}

                <Route
                    path="/doctor"
                    element={
                        <ProtectedRoute role="DOCTOR">
                            <DoctorDashboard />
                        </ProtectedRoute>
                    }
                />


                {/* ==========================
                    DEFAULT
                ========================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;