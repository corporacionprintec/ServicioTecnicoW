import React, { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RepairRequestForm from "./components/RepairRequestForm";
import EmployeeDashboardPage from "./components/EmployeeDashboard";
import { useAuth } from "./contexts/AuthContext";

import "./App.css";


function DynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      "/": "hoja de atencion",
      "/homepage": "Formulario de reparacion",
      "/login": "Iniciar Sesión",
      "/employee-dashboard": "Panel Técnico",
      "/admin-dashboard": "Panel Administrador",
    };

    document.title = titles[location.pathname] || "Mi Empresa";
  }, [location]);

  return null;
}

function App() {
  const { currentUser, loginRole } = useAuth();

  return (
    <>
      <DynamicTitle />
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
        <Route path="/homepage" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/repair-request-form" element={<RepairRequestForm />} />
        {/*  <Route path="/Estadistica-personal" element={<EstadisticasPersonal />} />*/}
          <Route
            path="/employee-dashboard"
            element={
              currentUser && (["tecnico", "administrador"].includes(loginRole) || ["tecnico", "administrador"].includes(currentUser.rol)) ? (
                <EmployeeDashboardPage />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/admin-dashboard"
            element={<Navigate to="/employee-dashboard" replace />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
