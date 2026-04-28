import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";

import { InteractionStatus } from "@azure/msal-browser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
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
        if (inProgress === InteractionStatus.None) {
            instance.loginPopup(loginRequest)
                .then(response => {
                    console.log("[MSAL] Login exitoso:", response.account.username);
                })
                .catch(e => {
                    if (e.errorCode === "interaction_in_progress") {
                        console.warn("[MSAL] Interacción en curso detectada. Intentando limpiar estado...");
                    } else {
                        console.error("[MSAL] Error en login:", e);
                    }
                });
        } else {
            console.warn("[MSAL] Bloqueado login por interacción en curso:", inProgress);
        }
    };

    const logout = () => {
        if (inProgress === InteractionStatus.None) {
            instance.logoutRedirect({
                postLogoutRedirectUri: "/",
            }).catch(e => {
                console.error(e);
            });
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            loading: loading || inProgress !== InteractionStatus.None,
            inProgress,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
