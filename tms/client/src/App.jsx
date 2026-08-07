import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Fees from "./pages/Fees";
import Attendance from "./pages/Attendance";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toast } from "./components/UI";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";

import UpiPay from "./components/UpiPay";

function Shell({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("tms_theme") || "light");
  const [instituteName, setInstituteName] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("tms_theme", theme);
  }, [theme]);

  useEffect(() => {
    api.get("/settings").then((res) => setInstituteName(res.data?.institute_name || "")).catch(() => {});
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className="tms-shell">
      <Sidebar instituteName={instituteName} theme={theme} toggleTheme={toggleTheme} />
      <main className="tms-main">{children}</main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState("");
  const notify = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Shell><Dashboard notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><Shell><Students notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><Shell><Fees notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Shell><Attendance notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Shell><Expenses notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Shell><Reports notify={notify} /></Shell></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Shell><SettingsPage notify={notify} /></Shell></ProtectedRoute>} />
      </Routes>
      <Toast message={toast} />
    </>
  );
}
