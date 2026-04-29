import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";

import { InteractionStatus } from "@azure/msal-browser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const isMsAuthenticated = useIsAuthenticated();
    
    const [googleUser, setGoogleUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario de Google si existe en localStorage
    useEffect(() => {
        const storedGoogleUser = localStorage.getItem('google_user');
        if (storedGoogleUser) {
            try {
                const parsed = JSON.parse(storedGoogleUser);
                setGoogleUser(parsed);
            } catch (e) {
                localStorage.removeItem('google_user');
            }
        }
    }, []);

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
            setLoading(false);
        } else if (googleUser) {
            setIsAuthenticated(true);
            setUser({
                name: googleUser.name,
                email: googleUser.email,
                provider: 'google',
                avatar: googleUser.picture
            });
            setLoading(false);
        } else {
            setIsAuthenticated(false);
            setUser(null);
            // Solo dejamos de cargar si no estamos en medio de un proceso de MSAL
            if (inProgress === InteractionStatus.None) {
                setLoading(false);
            }
        }
    }, [isMsAuthenticated, accounts, googleUser, inProgress]);

    const login = () => {
        if (inProgress === InteractionStatus.None) {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error("[MSAL] Error en loginRedirect:", e);
            });
        }
    };

    const loginGoogle = (decoded) => {
        setGoogleUser(decoded);
        localStorage.setItem('google_user', JSON.stringify(decoded));
    };

    const logout = () => {
        if (user?.provider === 'microsoft') {
            instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin,
            }).catch(e => {
                console.error(e);
            });
        } else {
            setGoogleUser(null);
            localStorage.removeItem('google_user');
            window.location.reload();
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            loading: loading || inProgress !== InteractionStatus.None,
            inProgress,
            login,
            loginGoogle,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
