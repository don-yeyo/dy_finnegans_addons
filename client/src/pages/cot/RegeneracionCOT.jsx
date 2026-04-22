import React, { useState, useEffect } from 'react';
import { Card, Input } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { FinnegansService, COTService } from '../../services/api';
import {
    Search, ArrowLeft, ArrowRight, RefreshCcw, Eye, Send,
    Truck, FileText, CheckCircle, AlertCircle, Package, MapPin,
    ChevronDown, ChevronUp, Filter, Calendar
} from 'lucide-react';

const STEPS = [
    { label: 'Seleccionar Remitos', icon: Search },
    { label: 'Nuevos Datos', icon: RefreshCcw }
];

const DEFAULT_DAYS = parseInt(import.meta.env.VITE_DEFAULT_COT_DAYS || '5');

const RegeneracionCOT = () => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Accordion / Selection
    const [rangoDias, setRangoDias] = useState(() => {
        const saved = localStorage.getItem('dy_cot_rango_dias');
        return saved ? parseInt(saved) : DEFAULT_DAYS;
    });
    const [hojasRuta, setHojasRuta] = useState([]);
    const [expandedHoja, setExpandedHoja] = useState(null);
    const [remitosPorHoja, setRemitosPorHoja] = useState({});
    const [selectedRemitos, setSelectedRemitos] = useState({}); // { [hojaId]: [remitoId1, remitoId2] }

    // Step 2: Form
    const [cotForm, setCotForm] = useState({
        cuitTransportista: '',
        razonSocialTransportista: '',
        patente: '',
        patenteAcoplado: '',
        fechaPartida: new Date().toISOString().split('T')[0],
        horaPartida: '',
        itemsSeleccionados: [] // Remitos a procesar
    });
    const [cotResult, setCotResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'warning' });

    // --- Effects ---
    useEffect(() => {
        cargarHojasRuta();
        localStorage.setItem('dy_cot_rango_dias', rangoDias);
    }, [rangoDias]);

    // --- Computed ---
    const hojasFiltradas = hojasRuta.filter(h => {
        // Filtro por estado
        if (h.ESTADOHR !== 'Pendiente') return false;
        
        // Filtro por texto de búsqueda
        if (!searchTerm) return true;
        return String(h.DOCNROINTERNO).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // --- Handlers ---

    const cargarHojasRuta = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await FinnegansService.buscarPorRango(rangoDias);
            let data = Array.isArray(res.data) ? res.data : [];
            
            // Ordenar por fecha descendente (más recientes primero)
            // Formato esperado: DD-MM-YYYY
            data.sort((a, b) => {
                const dateA = a.FECHA ? a.FECHA.split('-').reverse().join('-') : '';
                const dateB = b.FECHA ? b.FECHA.split('-').reverse().join('-') : '';
                return dateB.localeCompare(dateA);
            });

            setHojasRuta(data);
        } catch (err) {
            setError('Error cargando Hojas de Ruta de Finnegans.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleHoja = async (hoja) => {
        const id = hoja.TRANSACCIONID || hoja.DOCNROINTERNO;
        if (expandedHoja === id) {
            setExpandedHoja(null);
            return;
        }

        setExpandedHoja(id);
        if (!remitosPorHoja[id]) {
            setLoading(true);
            try {
                const res = await FinnegansService.getRemitos(id);
                setRemitosPorHoja(prev => ({ ...prev, [id]: res.data }));
            } catch (err) {
                console.error('Error cargando remitos:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleRemito = (hojaId, remito) => {
        setSelectedRemitos(prev => {
            const ids = prev[hojaId] || [];
            const isSelected = ids.some(r => r.id === remito.id);
            if (isSelected) {
                return { ...prev, [hojaId]: ids.filter(r => r.id !== remito.id) };
            } else {
                return { ...prev, [hojaId]: [...ids, remito] };
            }
        });
    };

    const irAConfigurar = () => {
        const seleccion = Object.values(selectedRemitos).flat();
        if (seleccion.length === 0) {
            setAlertModal({
                show: true,
                title: 'Selección Necesaria',
                message: 'Por favor, selecciona al menos un remito de la lista para poder generar el COT.',
                type: 'warning'
            });
            return;
        }

        // Pre-cargar datos del transportista de la primera hoja seleccionada
        const primeraHojaId = Object.keys(selectedRemitos).find(k => selectedRemitos[k].length > 0);
        const hoja = hojasRuta.find(h => (h.TRANSACCIONID || h.DOCNROINTERNO) == primeraHojaId);

        setCotForm(prev => ({
            ...prev,
            cuitTransportista: hoja?.TRANSPORTISTAID || '',
            razonSocialTransportista: hoja?.TRANSPORTISTA || '',
            itemsSeleccionados: seleccion
        }));
        setError('');
        setCurrentStep(1);
    };

    const validarPatente = (p) => {
        if (!p) return true;
        // Formato LLL-### (Usuario pidió LLL-###)
        return /^[A-Z]{3}-\d{3}$/.test(p);
    };

    const enviarARBA = async () => {
        if (!validarPatente(cotForm.patente)) {
            setError('Formato de patente inválido (Debe ser LLL-###).');
            return;
        }
        setShowConfirmModal(false);
        setLoading(true);
        setError('');
        try {
            // En una implementación real, esto enviaría un batch o iteraría
            // Por ahora enviamos el conjunto de remitos seleccionados
            const res = await COTService.regenerar({
                ...cotForm,
                remitos: cotForm.itemsSeleccionados
            });
            setCotResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error enviando COT a ARBA.');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setCurrentStep(0);
        setSelectedRemitos({});
        setCotResult(null);
        setError('');
    };

    // --- Render Helpers ---

    const renderRangoSelector = () => (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                background: 'var(--surface-hover)', padding: '12px 20px', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
            }}>
                <Calendar size={18} style={{ color: 'var(--dy-red)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ver Hojas de Ruta de los últimos:</span>
                <select 
                    value={rangoDias} 
                    onChange={(e) => setRangoDias(parseInt(e.target.value))}
                    className="dy-select"
                >
                    {[1, 2, 3, 5, 10, 15, 30].map(d => (
                        <option key={d} value={d}>{d} días</option>
                    ))}
                </select>
                <div style={{ marginLeft: 'auto' }}>
                    <Button variant="ghost" size="sm" onClick={cargarHojasRuta} loading={loading}>
                        <RefreshCcw size={14} /> Refrescar
                    </Button>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                    type="text"
                    placeholder="Filtrar por número de Hoja de Ruta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '48px', width: '100%' }}
                />
            </div>
        </div>
    );

    const renderAccordion = () => (
        <div className="dy-accordion-list">
            {hojasFiltradas.map((hoja, i) => {
                const id = hoja.TRANSACCIONID || hoja.DOCNROINTERNO;
                const isExpanded = expandedHoja === id;
                const seleccionados = (selectedRemitos[id] || []).length;

                return (
                    <div key={id} className={`dy-accordion ${isExpanded ? 'expanded' : ''}`}>
                        <div className="dy-accordion-header" onClick={() => toggleHoja(hoja)}>
                            <div className="dy-accordion-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="dy-accordion-title">{hoja.DOCNROINTERNO}</span>
                                    <span className="badge badge-outline">{hoja.FECHA}</span>
                                </div>
                                <div className="dy-accordion-subtitle">
                                    <Truck size={14} /> {hoja.TRANSPORTISTA} | <Package size={14} /> Patente: {hoja.PATENTE || 'S/P'}
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {seleccionados > 0 && (
                                    <span className="badge badge-success">{seleccionados} remitos sel.</span>
                                )}
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="dy-accordion-body">
                                {loading && !remitosPorHoja[id] ? (
                                    <div className="loader-inline">Cargando remitos...</div>
                                ) : (
                                    <div className="remitos-list">
                                        <table className="results-table-sm">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}></th>
                                                    <th>Cliente</th>
                                                    <th>Pedido</th>
                                                    <th>Fecha</th>
                                                    <th>Despacho</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(remitosPorHoja[id] || []).map((remito, idx) => {
                                                    const isSelected = (selectedRemitos[id] || []).some(r => r.id === remito.id);
                                                    return (
                                                        <tr key={idx} onClick={() => toggleRemito(id, remito)}>
                                                            <td>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isSelected}
                                                                    onChange={() => {}} // Se maneja con el tr.onClick
                                                                />
                                                            </td>
                                                            <td style={{ fontWeight: 600 }}>{remito.cliente}</td>
                                                            <td>
                                                                <div style={{ fontSize: '0.8rem' }}>{remito.pedidoTipo}</div>
                                                                <div>{remito.comprobante}</div>
                                                            </td>
                                                            <td>{remito.fecha}</td>
                                                            <td>{remito.despacho}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // --- Final Render ---

    return (
        <div className="card-anim">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>
                    Regeneración de COT<span style={{ color: 'var(--dy-red)' }}>.</span>
                </h1>
            </header>

            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className={`stepper-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}>
                            <div className="stepper-circle">
                                {i < currentStep ? <CheckCircle size={20} /> : i + 1}
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`stepper-connector ${i < currentStep ? 'active' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* STEP 0: Selección */}
            {currentStep === 0 && (
                <Card>
                    {renderRangoSelector()}
                    {hojasRuta.length > 0 ? renderAccordion() : (
                        <div className="empty-state">
                            <Truck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3>No se encontraron Hojas de Ruta</h3>
                            <p>Intente ampliando el rango de días o verificando la conexión.</p>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                        <Button onClick={irAConfigurar} size="lg">
                            Continuar <ArrowRight size={18} />
                        </Button>
                    </div>
                </Card>
            )}

            {/* STEP 1: Formulario y Envío */}
            {currentStep === 1 && !cotResult && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 className="form-section-title">Configurar Nuevo Transporte</h2>
                        <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                            <ArrowLeft size={18} /> Volver
                        </Button>
                    </div>

                    <div className="form-grid" style={{ marginBottom: '32px' }}>
                        <div className="form-section" style={{ gridColumn: 'span 2' }}>
                            <div className="form-section-title">
                                <Truck size={16} /> Vehículo y Transportista
                            </div>
                            <div className="form-grid">
                                <Input 
                                    label="Transportista"
                                    value={cotForm.razonSocialTransportista}
                                    onChange={(e) => setCotForm({...cotForm, razonSocialTransportista: e.target.value})}
                                />
                                <Input 
                                    label="CUIT"
                                    value={cotForm.cuitTransportista}
                                    onChange={(e) => setCotForm({...cotForm, cuitTransportista: e.target.value})}
                                />
                                <Input 
                                    label="Patente Camión *"
                                    placeholder="Ej: LLL-123"
                                    value={cotForm.patente}
                                    onChange={(e) => setCotForm({...cotForm, patente: e.target.value.toUpperCase()})}
                                />
                                <Input 
                                    label="Patente Acoplado"
                                    placeholder="Ej: LLL-123"
                                    value={cotForm.patenteAcoplado}
                                    onChange={(e) => setCotForm({...cotForm, patenteAcoplado: e.target.value.toUpperCase()})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">Remitos Seleccionados ({cotForm.itemsSeleccionados.length})</div>
                        <div className="selected-items-grid">
                            {cotForm.itemsSeleccionados.map((item, i) => (
                                <div key={i} className="selected-item-tag">
                                    <FileText size={14} />
                                    <span>{item.despacho} - {item.cliente}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '40px' }}>
                        <Button 
                            variant="primary" 
                            size="lg" 
                            style={{ 
                                background: 'linear-gradient(135deg, #e40521 0%, #b3041a 100%)',
                                boxShadow: '0 10px 20px rgba(228, 5, 33, 0.2)' 
                            }}
                            onClick={() => setShowConfirmModal(true)}
                        >
                            <Send size={18} /> Generar nuevo COT
                        </Button>
                    </div>
                </Card>
            )}

            {/* Resultado */}
            {cotResult && (
                <Card style={{ textAlign: 'center', padding: '60px' }}>
                    {cotResult.success ? (
                        <>
                            <div className="success-icon-large"><CheckCircle size={64} /></div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>COT Generado con Éxito</h2>
                            <div className="cot-number-display">{cotResult.nroCOT}</div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Se ha generado la regeneración para los remitos seleccionados.</p>
                        </>
                    ) : (
                        <>
                            <div className="error-icon-large"><AlertCircle size={64} /></div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--error)' }}>Error ARBA</h2>
                            <p>{cotResult.errores?.[0]?.descripcion || 'Ocurrió un error inesperado.'}</p>
                        </>
                    )}
                    <Button onClick={resetFlow} variant="secondary"><RefreshCcw size={18} /> Volver a Empezar</Button>
                </Card>
            )}

            {/* Modal de Alertas/Validaciones */}
            <Modal
                isOpen={alertModal.show}
                onClose={() => setAlertModal(prev => ({ ...prev, show: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmLabel="Entendido"
                showCancel={false}
            />

            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="¿Confirmar Regeneración?"
                type="warning"
                onConfirm={enviarARBA}
                confirmLabel="Sí, Generar COT"
            >
                Usted está por generar un nuevo COT para <strong>{cotForm.itemsSeleccionados.length} remitos</strong> con la patente <strong>{cotForm.patente}</strong>. Esta acción se presentará ante ARBA.
            </Modal>
        </div>
    );
};

export default RegeneracionCOT;
