import React from 'react';
import { X, Settings, LayoutDashboard, RefreshCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Drawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
        { icon: <RefreshCcw size={20} />, label: 'Regeneración de COT', path: '/regeneracion-cot' },
        { icon: <Settings size={20} />, label: 'Configuración', path: '/configuracion' },
    ];

    const handleClick = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            <div
                className={`drawer-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`drawer ${isOpen ? 'open' : ''} glass`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--drawer-title)' }}>Menú</h2>
                    <button className="mode-toggle" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => handleClick(item.path)}
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    borderRadius: '15px',
                                    justifyContent: 'flex-start',
                                    background: isActive ? 'rgba(228, 5, 33, 0.08)' : 'transparent',
                                    color: isActive ? 'var(--dy-red)' : 'var(--text)',
                                    fontWeight: isActive ? 700 : 500,
                                    border: isActive ? '1px solid rgba(228, 5, 33, 0.25)' : 'none',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ color: 'var(--dy-red)', marginRight: '10px', verticalAlign: 'middle' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ position: 'absolute', bottom: '40px', left: '24px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--drawer-footer)', fontWeight: 700 }}>DON YEYO S.A.</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v{__APP_VERSION__}</p>
                </div>
            </div>
        </>
    );
};

export default Drawer;
