import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../cssGeneral/login/login.css';

function LoginPage() {
  const [dni, setDni] = useState('');
  const [role, setRole] = useState('tecnico'); // Valor por defecto
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const storedDni = localStorage.getItem('dni');
    const storedRole = localStorage.getItem('role');
    if (storedDni && storedRole) {
      setDni(storedDni);
      setRole(storedRole);
      handleAutoLogin(storedDni, storedRole);
    }
  }, []);

  const handleAutoLogin = async (storedDni, storedRole) => {
    try {
      const result = await login(storedDni, storedRole);
      if (result.success) {
        if (result.user.rol === 'administrador') {
          if (storedRole === 'tecnico') {
            navigate('/employee-dashboard');
          } else if (storedRole === 'administrador') {
            navigate('/admin-dashboard');
          } else {
            setError('Rol no reconocido');
          }
        } else if (result.user.rol === 'tecnico') {
          navigate('/employee-dashboard');
        } else {
          setError('Rol no reconocido');
        }
      } else {
        setError(result.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      setError('Error en el servidor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(dni, role);
      if (result.success) {
        localStorage.setItem('dni', dni);
        localStorage.setItem('role', role);
        if (result.user.rol === 'administrador') {
          if (role === 'tecnico') {
            navigate('/employee-dashboard');
          } else if (role === 'administrador') {
            navigate('/admin-dashboard');
          } else {
            setError('Rol no reconocido');
          }
        } else if (result.user.rol === 'tecnico') {
          navigate('/employee-dashboard');
        } else {
          setError('Rol no reconocido');
        }
      } else {
        setError(result.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      setError('Error en el servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dni');
    localStorage.removeItem('role');
    setDni('');
    setRole('tecnico');
    navigate('/login');
  };

  return (
    <div className="login-bg d-flex justify-center align-center">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        {error && <div className="login-alert">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-group">
            <label className="login-label">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingrese su DNI"
              required
              className="login-input"
            />
          </div>
          <div className="login-group">
            <label className="login-label">Tipo de Usuario</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="login-select"
            >
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <button type="submit" className="login-btn">Ingresar</button>
        </form>
        {dni && (
          <div className="login-logout-container">
            <button className="login-logout-btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
