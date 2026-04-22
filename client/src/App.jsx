import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "./config/ThemeContext";
import { AuthProvider, useAuth } from './config/AuthContext';
import './index.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RegeneracionCOT from './pages/cot/RegeneracionCOT';
import { Button } from './components/Button';

const AuthGate = ({ children }) => {
    const { isAuthenticated, loading, login } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card loading-card">Cargando aplicación...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--dy-bg-dark)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
            }}>
                <img 
                    src="/src/assets/logo-don-yeyo-png-sin-fondo.png" 
                    alt="Don Yeyo" 
                    style={{ width: '180px', marginBottom: '40px' }}
                />
                <h1 style={{ marginBottom: '10px' }}>Finnegans Addons</h1>
                <p style={{ marginBottom: '30px', opacity: 0.8 }}>Ingresa con tu cuenta institucional de Don Yeyo</p>
                <Button onClick={login} size="lg" style={{ minWidth: '240px' }}>
                    Iniciar Sesión con Microsoft
                </Button>
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
