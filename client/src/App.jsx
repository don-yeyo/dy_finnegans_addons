import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from "./config/ThemeContext";
import { AuthProvider, useAuth } from './config/AuthContext';
import './index.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RegeneracionCOT from './pages/cot/RegeneracionCOT';
import { Button } from './components/Button';

import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import microsoftLogo from './assets/microsoft-logo.png';
import googleLogo from './assets/google-logo.svg';
import { Sun, Moon } from 'lucide-react';

const AuthGate = ({ children }) => {
    const { isAuthenticated, loading, login } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card loading-card">Cargando aplicación...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="glass login-container" style={{
                height: '100vh',
                display: 'flex',
                gap: '8px',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                background: 'var(--dy-bg-dark)',
            }}>
                <button
                    onClick={toggleTheme}
                    className="mode-toggle"
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Cambiar modo"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <img src={logo} alt="Don Yeyo" style={{ height: '140px', marginBottom: '16px', objectFit: 'contain' }} />
                
                <h1 style={{ fontWeight: '800', color: 'var(--header-text)', margin: 0 }}>
                    Finnegans Addons
                </h1>

                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '16px 0 32px 0', fontSize: '1.1rem' }}>
                    Bienvenido. Inicie sesión con su cuenta corporativa de Don Yeyo para continuar.
                </p>

                <div className="login-options">
                    <Button
                        className="btn-microsoft"
                        onClick={login}
                    >
                        <img
                            src={microsoftLogo}
                            alt="Microsoft"
                            style={{ height: '26px', width: '26px', objectFit: 'contain' }}
                        />
                        Inicia sesión con Microsoft
                    </Button>

                    {import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false' && (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                maxWidth: '320px',
                                margin: '8px 0',
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                <span>O</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                            </div>

                            <Button
                                className="btn-google"
                                onClick={() => alert('Próximamente disponible')}
                            >
                                <img
                                    src={googleLogo}
                                    alt="Google"
                                    style={{ height: '26px', width: '26px', objectFit: 'contain' }}
                                />
                                Inicia sesión con Google
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <AuthGate>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/regeneracion-cot" element={<RegeneracionCOT />} />
                                <Route path="/configuracion" element={<Settings />} />
                            </Routes>
                        </Layout>
                    </AuthGate>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
