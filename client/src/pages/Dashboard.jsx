import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, ArrowRight, Wrench } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    const addons = [
        {
            icon: <RefreshCcw size={28} />,
            title: 'Regeneración de COT',
            description: 'Buscar envíos, consultar hojas de ruta y regenerar el COT con nuevos datos de transporte.',
            path: '/regeneracion-cot',
            ready: true
        },
        {
            icon: <Wrench size={28} />,
            title: 'Próximamente',
            description: 'Nuevas funcionalidades en desarrollo.',
            path: '#',
            ready: false
        }
    ];

    return (
        <div className="card-anim">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>
                    Dashboard<span style={{ color: 'var(--dy-red)' }}>.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '1.1rem' }}>
                    Herramientas auxiliares para la gestión operativa de Don Yeyo.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {addons.map((addon, index) => (
                    <div
                        key={index}
                        className="addon-card"
                        onClick={() => addon.ready && navigate(addon.path)}
                        style={{ opacity: addon.ready ? 1 : 0.5, cursor: addon.ready ? 'pointer' : 'default' }}
                    >
                        <div className="addon-card-icon">
                            {addon.icon}
                        </div>
                        <div className="addon-card-content" style={{ flex: 1 }}>
                            <h3>{addon.title}</h3>
                            <p>{addon.description}</p>
                        </div>
                        {addon.ready && (
                            <ArrowRight size={24} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        )}
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '60px',
                padding: '24px',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                border: '1px dashed var(--border)',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>Finnegans Addons</strong> — Sistema de herramientas auxiliares para Don Yeyo S.A.
                    <br />
                    Consultas a Finnegans ERP e interacción con servicios externos (ARBA, ARCA).
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
