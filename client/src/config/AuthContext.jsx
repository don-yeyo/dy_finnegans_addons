import React, { createContext, useContext, useState } from 'react';

/**
 * AuthContext simplificado para Finnegans Addons.
 * Usa mock auth por defecto (configurable por env).
 * Preparado para conectar con autenticación real (MSAL, Google, etc.) cuando se defina.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user] = useState({
        name: import.meta.env.VITE_MOCK_USER_NAME || 'Usuario',
        email: import.meta.env.VITE_MOCK_USER_EMAIL || 'usuario@donyeyo.com.ar',
        provider: 'mock',
        avatar: null
    });

    const [isAuthenticated] = useState(true);

    const logout = () => {
        // Para mock auth, simplemente recargamos
        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
