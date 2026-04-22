import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { instance, accounts } = useMsal();
    const isMsAuthenticated = useIsAuthenticated();
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // BYPASS DE AUTENTICACION PARA DESARROLLO LOCAL
        if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true') {
            const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL;
            const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || "Usuario Mock";

            console.log(`⚠️ MODO MOCK ACTIVADO: Entrando como ${mockEmail}`);
            setIsAuthenticated(true);
            setUser({
                name: mockName,
                email: mockEmail,
                provider: 'mock',
                avatar: null
            });
            setLoading(false);
            return;
        }

        if (isMsAuthenticated && accounts.length > 0) {
            setIsAuthenticated(true);
            setUser({
                name: accounts[0].name,
                email: accounts[0].username,
                provider: 'microsoft',
                avatar: null
            });
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
        setLoading(false);
    }, [isMsAuthenticated, accounts]);

    const login = () => {
        instance.loginRedirect(loginRequest).catch(e => {
            console.error(e);
        });
    };

    const logout = () => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
        }).catch(e => {
            console.error(e);
        });
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            loading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
