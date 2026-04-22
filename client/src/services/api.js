import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
});

export const FinnegansService = {
    buscarEnvios: (filtro) =>
        api.get('/finnegans/envios', { params: filtro }),
    getHojasRuta: (envioId) =>
        api.get(`/finnegans/envios/${envioId}/hojas-ruta`),
    getDetalleHojaRuta: (hojaRutaId) =>
        api.get(`/finnegans/hojas-ruta/${hojaRutaId}`),
};

export const COTService = {
    regenerar: (data) =>
        api.post('/cot/regenerar', data),
    preview: (data) =>
        api.post('/cot/preview', data),
};

export const SystemService = {
    getVersion: (v) =>
        api.get(`/system/version${v ? `?v=${v}` : ''}`),
};

export default api;
