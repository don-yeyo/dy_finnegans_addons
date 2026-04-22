import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "./config/ThemeContext";
import { AuthProvider } from './config/AuthContext';
import './index.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import RegeneracionCOT from './pages/cot/RegeneracionCOT';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/regeneracion-cot" element={<RegeneracionCOT />} />
                            <Route path="/configuracion" element={<Settings />} />
                        </Routes>
                    </Layout>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
