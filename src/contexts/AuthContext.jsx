import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Se intenta cargar el usuario y rol persistidos en localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [loginRole, setLoginRole] = useState(() => {
    return localStorage.getItem('loginRole') || null;
  });

  const login = async (dni, role) => {
    try {
      const response = await fetch('https://servidorserviciotecnico-production.up.railway.app/api/tecnicos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: dni, role }) // Se envía el rol seleccionado
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en el login:", errorData.message);
        return { success: false, message: errorData.message || "Error desconocido" };
      }

      const data = await response.json();
      
      if (!data.user) {
        console.error("No se encontró la propiedad 'user' en la respuesta:", data);
        return { success: false, message: "Error en la respuesta del servidor" };
      }

      // Construimos el objeto usuario con los datos recibidos del servidor
      const user = {
        id: data.user.id,
        name: data.user.nombre,
        lastname: data.user.apellido,
        rol: data.user.rol || 'tecnico',
        telefono: data.user.telefono
      };

      // Actualizamos el estado y persistimos en localStorage
      setCurrentUser(user);
      setLoginRole(role);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('loginRole', role);

      return { success: true, user };
      
    } catch (error) {
      console.error("Error de conexión:", error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setLoginRole(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginRole');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loginRole }}>
      {children}
    </AuthContext.Provider>
  );
}
