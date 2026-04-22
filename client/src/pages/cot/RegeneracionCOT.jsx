import React, { useState } from 'react';
import { Card, Input } from '../../components/FormElements';
import { Button } from '../../components/Button';
import Modal from '../../components/Modal';
import { FinnegansService, COTService } from '../../services/api';
import {
    Search, ArrowLeft, ArrowRight, RefreshCcw, Eye, Send,
    Truck, FileText, CheckCircle, AlertCircle, Package, MapPin
} from 'lucide-react';

const STEPS = [
    { label: 'Buscar Envío', icon: Search },
    { label: 'Hojas de Ruta', icon: FileText },
    { label: 'Regenerar COT', icon: RefreshCcw }
];

const RegeneracionCOT = () => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Buscar envío
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFechaDesde, setSearchFechaDesde] = useState('');
    const [searchFechaHasta, setSearchFechaHasta] = useState('');
    const [envios, setEnvios] = useState([]);
    const [selectedEnvio, setSelectedEnvio] = useState(null);

    // Step 2: Hojas de ruta
    const [hojasRuta, setHojasRuta] = useState([]);
    const [selectedHoja, setSelectedHoja] = useState(null);

    // Step 3: Regenerar COT
    const [cotForm, setCotForm] = useState({
        cuitTransportista: '',
        razonSocialTransportista: '',
        patente: '',
        patenteAcoplado: '',
        cuitDestinatario: '',
        razonSocialDestinatario: '',
        domicilioOrigen: '',
        domicilioDestino: '',
        fechaPartida: '',
        horaPartida: '',
        nroRemito: '',
        productos: []
    });
    const [cotPreview, setCotPreview] = useState(null);
    const [cotResult, setCotResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- Handlers ---

    const buscarEnvios = async () => {
        if (!searchQuery && !searchFechaDesde) {
            setError('Ingrese un número de envío o un rango de fechas.');
            return;
        }
        setLoading(true);
        setError('');
        setEnvios([]);
        try {
            const res = await FinnegansService.buscarEnvios({
                numero: searchQuery || undefined,
                fechaDesde: searchFechaDesde || undefined,
                fechaHasta: searchFechaHasta || undefined
            });
            const data = Array.isArray(res.data) ? res.data : [];
            setEnvios(data);
            if (data.length === 0) {
                setError('No se encontraron envíos con los criterios ingresados.');
            }
        } catch (err) {
            console.error('Error buscando envíos:', err);
            setError(err.response?.data?.error || 'Error conectando con Finnegans. Verificar credenciales en el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const seleccionarEnvio = async (envio) => {
        setSelectedEnvio(envio);
        setLoading(true);
        setError('');
        try {
            const envioId = envio.Id || envio.id || envio.EnvioId || envio.Numero;
            const res = await FinnegansService.getHojasRuta(envioId);
            const data = Array.isArray(res.data) ? res.data : [];
            setHojasRuta(data);
            setCurrentStep(1);
            if (data.length === 0) {
                setError('Este envío no tiene hojas de ruta asociadas.');
            }
        } catch (err) {
            console.error('Error obteniendo hojas de ruta:', err);
            setError(err.response?.data?.error || 'Error obteniendo hojas de ruta.');
        } finally {
            setLoading(false);
        }
    };

    const seleccionarHojaRuta = (hoja) => {
        setSelectedHoja(hoja);
        // Pre-cargar datos actuales de la hoja de ruta en el formulario
        setCotForm({
            cuitTransportista: hoja.CUITTransportista || hoja.cuitTransportista || '',
            razonSocialTransportista: hoja.TransportistaRazonSocial || hoja.transportista || '',
            patente: '', // Vacío a propósito: el usuario debe ingresar la nueva patente
            patenteAcoplado: '',
            cuitDestinatario: hoja.CUITDestinatario || hoja.cuitDestinatario || '',
            razonSocialDestinatario: hoja.DestinatarioRazonSocial || hoja.destinatario || '',
            domicilioOrigen: hoja.DomicilioOrigen || hoja.domicilioOrigen || '',
            domicilioDestino: hoja.DomicilioDestino || hoja.domicilioDestino || '',
            fechaPartida: hoja.FechaPartida || hoja.fecha || new Date().toISOString().split('T')[0],
            horaPartida: hoja.HoraPartida || hoja.hora || '',
            nroRemito: hoja.NumeroRemito || hoja.nroRemito || '',
            productos: hoja.Productos || hoja.productos || []
        });
        setCotPreview(null);
        setCotResult(null);
        setCurrentStep(2);
    };

    const handleCotFormChange = (field, value) => {
        setCotForm(prev => ({ ...prev, [field]: value }));
    };

    const generarPreview = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await COTService.preview(cotForm);
            setCotPreview(res.data);
        } catch (err) {
            setError('Error generando preview del COT.');
        } finally {
            setLoading(false);
        }
    };

    const enviarARBA = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setError('');
        try {
            const res = await COTService.regenerar(cotForm);
            setCotResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error enviando COT a ARBA.');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setCurrentStep(0);
        setSelectedEnvio(null);
        setSelectedHoja(null);
        setHojasRuta([]);
        setCotForm({
            cuitTransportista: '', razonSocialTransportista: '', patente: '', patenteAcoplado: '',
            cuitDestinatario: '', razonSocialDestinatario: '', domicilioOrigen: '', domicilioDestino: '',
            fechaPartida: '', horaPartida: '', nroRemito: '', productos: []
        });
        setCotPreview(null);
        setCotResult(null);
        setError('');
    };

    // --- Render ---

    return (
        <div className="card-anim">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>
                    Regeneración de COT<span style={{ color: 'var(--dy-red)' }}>.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '1.1rem' }}>
                    Buscar envío → Seleccionar hoja de ruta → Regenerar COT con nuevos datos de transporte.
                </p>
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
                <div style={{
                    padding: '16px 20px', borderRadius: '16px', marginBottom: '24px',
                    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error)'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{error}</span>
                </div>
            )}

            {/* ===== STEP 1: Buscar Envío ===== */}
            {currentStep === 0 && (
                <Card>
                    <div className="form-section">
                        <div className="form-section-title">Buscar Envío en Finnegans</div>
                        <div className="form-grid">
                            <Input
                                label="Número de Envío"
                                placeholder="Ej: 12345"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && buscarEnvios()}
                            />
                            <Input
                                label="Fecha Desde"
                                type="date"
                                value={searchFechaDesde}
                                onChange={(e) => setSearchFechaDesde(e.target.value)}
                            />
                            <Input
                                label="Fecha Hasta"
                                type="date"
                                value={searchFechaHasta}
                                onChange={(e) => setSearchFechaHasta(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <Button onClick={buscarEnvios} loading={loading}>
                                <Search size={18} /> Buscar
                            </Button>
                        </div>
                    </div>

                    {/* Resultados */}
                    {envios.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                {envios.length} envío(s) encontrado(s). Seleccione uno para ver sus hojas de ruta.
                            </p>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Número</th>
                                            <th>Fecha</th>
                                            <th>Destino</th>
                                            <th>Estado</th>
                                            <th>Transportista</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {envios.map((envio, i) => (
                                            <tr
                                                key={i}
                                                onClick={() => seleccionarEnvio(envio)}
                                                className={selectedEnvio === envio ? 'selected' : ''}
                                            >
                                                <td style={{ fontWeight: 700 }}>{envio.Numero || envio.numero || envio.Id || '-'}</td>
                                                <td>{envio.Fecha || envio.fecha || '-'}</td>
                                                <td>{envio.Destino || envio.destino || '-'}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {envio.Estado || envio.estado || '-'}
                                                    </span>
                                                </td>
                                                <td>{envio.Transportista || envio.transportista || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && envios.length === 0 && !error && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Truck size={36} />
                            </div>
                            <h3>Buscar un envío</h3>
                            <p>Ingrese un número de envío o un rango de fechas para comenzar.</p>
                        </div>
                    )}
                </Card>
            )}

            {/* ===== STEP 2: Hojas de Ruta ===== */}
            {currentStep === 1 && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <div className="form-section-title" style={{ marginBottom: '4px' }}>
                                Hojas de Ruta del Envío #{selectedEnvio?.Numero || selectedEnvio?.numero || selectedEnvio?.Id || ''}
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Seleccione la hoja de ruta que necesita regenerar.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => { setCurrentStep(0); setHojasRuta([]); setSelectedEnvio(null); }}>
                            <ArrowLeft size={18} /> Volver
                        </Button>
                    </div>

                    {hojasRuta.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>N° Hoja</th>
                                        <th>Fecha</th>
                                        <th>Patente</th>
                                        <th>Transportista</th>
                                        <th>COT Actual</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hojasRuta.map((hoja, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 700 }}>{hoja.Numero || hoja.numero || hoja.Id || i + 1}</td>
                                            <td>{hoja.Fecha || hoja.fecha || '-'}</td>
                                            <td>
                                                <span className="badge badge-info">
                                                    <Truck size={12} /> {hoja.Patente || hoja.patente || '-'}
                                                </span>
                                            </td>
                                            <td>{hoja.TransportistaRazonSocial || hoja.transportista || '-'}</td>
                                            <td>{hoja.COT || hoja.cot || '-'}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    onClick={() => seleccionarHojaRuta(hoja)}
                                                >
                                                    <RefreshCcw size={14} /> Regenerar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FileText size={36} />
                            </div>
                            <h3>Sin hojas de ruta</h3>
                            <p>Este envío no tiene hojas de ruta asociadas.</p>
                        </div>
                    )}
                </Card>
            )}

            {/* ===== STEP 3: Regenerar COT ===== */}
            {currentStep === 2 && !cotResult && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div className="form-section-title" style={{ marginBottom: 0 }}>
                            Nuevos datos de transporte
                        </div>
                        <Button variant="ghost" onClick={() => { setCurrentStep(1); setSelectedHoja(null); setCotPreview(null); }}>
                            <ArrowLeft size={18} /> Volver
                        </Button>
                    </div>

                    {/* Datos del transportista nuevo */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <Truck size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Transportista
                        </div>
                        <div className="form-grid">
                            <Input
                                label="CUIT Transportista *"
                                placeholder="Ej: 20123456789"
                                value={cotForm.cuitTransportista}
                                onChange={(e) => handleCotFormChange('cuitTransportista', e.target.value)}
                            />
                            <Input
                                label="Razón Social Transportista"
                                placeholder="Ej: TRANSPORTES S.A."
                                value={cotForm.razonSocialTransportista}
                                onChange={(e) => handleCotFormChange('razonSocialTransportista', e.target.value)}
                            />
                            <Input
                                label="Patente Vehículo *"
                                placeholder="Ej: AB123CD"
                                value={cotForm.patente}
                                onChange={(e) => handleCotFormChange('patente', e.target.value.toUpperCase())}
                            />
                            <Input
                                label="Patente Acoplado"
                                placeholder="Ej: EF456GH (opcional)"
                                value={cotForm.patenteAcoplado}
                                onChange={(e) => handleCotFormChange('patenteAcoplado', e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    {/* Datos del destinatario */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Origen / Destino
                        </div>
                        <div className="form-grid">
                            <Input
                                label="CUIT Destinatario"
                                value={cotForm.cuitDestinatario}
                                onChange={(e) => handleCotFormChange('cuitDestinatario', e.target.value)}
                            />
                            <Input
                                label="Razón Social Destinatario"
                                value={cotForm.razonSocialDestinatario}
                                onChange={(e) => handleCotFormChange('razonSocialDestinatario', e.target.value)}
                            />
                            <Input
                                label="Domicilio Origen"
                                value={cotForm.domicilioOrigen}
                                onChange={(e) => handleCotFormChange('domicilioOrigen', e.target.value)}
                            />
                            <Input
                                label="Domicilio Destino"
                                value={cotForm.domicilioDestino}
                                onChange={(e) => handleCotFormChange('domicilioDestino', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Datos del viaje */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <Package size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Datos del Viaje
                        </div>
                        <div className="form-grid">
                            <Input
                                label="Fecha de Partida *"
                                type="date"
                                value={cotForm.fechaPartida}
                                onChange={(e) => handleCotFormChange('fechaPartida', e.target.value)}
                            />
                            <Input
                                label="Hora de Partida"
                                type="time"
                                value={cotForm.horaPartida}
                                onChange={(e) => handleCotFormChange('horaPartida', e.target.value)}
                            />
                            <Input
                                label="N° Remito"
                                value={cotForm.nroRemito}
                                onChange={(e) => handleCotFormChange('nroRemito', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Productos (solo lectura) */}
                    {cotForm.productos.length > 0 && (
                        <div className="form-section">
                            <div className="form-section-title">Productos</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th>Cantidad</th>
                                            <th>Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cotForm.productos.map((prod, i) => (
                                            <tr key={i} style={{ cursor: 'default' }}>
                                                <td>{prod.codigo || prod.Codigo || '-'}</td>
                                                <td>{prod.descripcion || prod.Descripcion || '-'}</td>
                                                <td>{prod.cantidad || prod.Cantidad || '-'}</td>
                                                <td>{prod.unidad || prod.Unidad || 'UN'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {cotPreview && (
                        <div className="form-section">
                            <div className="form-section-title">Vista Previa del Archivo COT</div>
                            <div className="cot-preview">
                                {cotPreview.contenido}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Archivo: {cotPreview.nombreArchivo} — {cotPreview.lineas} línea(s) — {cotPreview.tamaño} bytes
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <Button variant="secondary" onClick={generarPreview} loading={loading && !showConfirmModal}>
                            <Eye size={18} /> Vista Previa
                        </Button>
                        <Button
                            onClick={() => {
                                if (!cotForm.patente || !cotForm.cuitTransportista || !cotForm.fechaPartida) {
                                    setError('Complete los campos obligatorios: Patente, CUIT Transportista y Fecha de Partida.');
                                    return;
                                }
                                setError('');
                                setShowConfirmModal(true);
                            }}
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #e40521 0%, #b3041a 100%)',
                                border: 'none', boxShadow: '0 8px 20px rgba(228, 5, 33, 0.25)'
                            }}
                        >
                            <Send size={18} /> Enviar a ARBA
                        </Button>
                    </div>
                </Card>
            )}

            {/* ===== Resultado COT ===== */}
            {currentStep === 2 && cotResult && (
                <Card style={{ textAlign: 'center', padding: '48px 32px' }}>
                    {cotResult.success ? (
                        <>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                color: 'var(--success)'
                            }}>
                                <CheckCircle size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>¡COT Generado!</h2>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '12px',
                                background: 'rgba(16, 185, 129, 0.08)', padding: '16px 32px',
                                borderRadius: 'var(--radius-pill)', border: '2px solid rgba(16, 185, 129, 0.2)',
                                marginBottom: '24px'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>N° COT:</span>
                                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--success)' }}>
                                    {cotResult.nroCOT}
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 32px' }}>
                                El nuevo COT fue generado exitosamente. Puede imprimirlo o anotarlo para el chofer.
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                color: 'var(--error)'
                            }}>
                                <AlertCircle size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--error)' }}>Error al Generar COT</h2>
                            {cotResult.errores && cotResult.errores.length > 0 && (
                                <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto 24px' }}>
                                    {cotResult.errores.map((err, i) => (
                                        <div key={i} style={{
                                            padding: '12px 16px', borderRadius: '12px', marginBottom: '8px',
                                            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)'
                                        }}>
                                            <span style={{ fontWeight: 700 }}>Error {err.codigo}:</span> {err.descripcion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    <Button onClick={resetFlow} size="lg">
                        <RefreshCcw size={18} /> Nueva Regeneración
                    </Button>
                </Card>
            )}

            {/* Confirm Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Confirmar Envío a ARBA"
                type="warning"
                confirmLabel="Confirmar y Enviar"
                onConfirm={enviarARBA}
            >
                <p style={{ marginBottom: '16px' }}>
                    Está a punto de enviar la solicitud de regeneración de COT a ARBA con los siguientes datos:
                </p>
                <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <p><strong>Patente:</strong> {cotForm.patente}</p>
                    <p><strong>Transportista:</strong> {cotForm.razonSocialTransportista} ({cotForm.cuitTransportista})</p>
                    <p><strong>Fecha:</strong> {cotForm.fechaPartida} {cotForm.horaPartida}</p>
                    {cotForm.patenteAcoplado && <p><strong>Acoplado:</strong> {cotForm.patenteAcoplado}</p>}
                </div>
                <p style={{ marginTop: '16px', color: 'var(--warning)', fontWeight: 600 }}>
                    ¿Está seguro de continuar?
                </p>
            </Modal>
        </div>
    );
};

export default RegeneracionCOT;
