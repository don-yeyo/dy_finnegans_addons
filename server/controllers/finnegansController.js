const FinnegansService = require('../services/finnegansService');
const finnegans = new FinnegansService();

/**
 * Buscar hojas de ruta en un rango de días.
 * GET /api/finnegans/hojas-ruta/rango?dias=5
 */
const buscarHojasRutaRango = async (req, res) => {
    try {
        const dias = parseInt(req.query.dias) || 5;
        const resultados = await finnegans.buscarHojasRutaRango(dias);
        res.json(resultados);
    } catch (error) {
        console.error('[Finnegans] Error buscando hojas por rango:', error.message);
        res.status(500).json({ error: 'Error buscando hojas de ruta.' });
    }
};

/**
 * Obtener remitos de una hoja de ruta.
 * GET /api/finnegans/hojas-ruta/:id/remitos
 */
const getRemitosHojaRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const remitos = await finnegans.getRemitosHojaRuta(id);
        res.json(remitos);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo remitos de HR:', error.message);
        res.status(500).json({ error: 'Error obteniendo remitos vinculados.' });
    }
};

/**
 * Buscar envíos en Finnegans.
 */
const buscarEnvios = async (req, res) => {
    try {
        const { numero, fechaDesde, fechaHasta } = req.query;
        const resultados = await finnegans.buscarEnvios({ numero, fechaDesde, fechaHasta });
        res.json(resultados);
    } catch (error) {
        console.error('[Finnegans] Error buscando envíos:', error.message);
        res.status(500).json({ error: 'Error consultando envíos.' });
    }
};

/**
 * Obtener hojas de ruta de un envío.
 * GET /api/finnegans/envios/:id/hojas-ruta
 */
const getHojasRuta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de envío requerido.' });
        }

        const hojasRuta = await finnegans.getHojasDeRuta(id);
        res.json(hojasRuta);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo hojas de ruta:', error.message);
        res.status(500).json({
            error: 'Error obteniendo hojas de ruta.',
            detalle: error.message
        });
    }
};

/**
 * Obtener detalle de una hoja de ruta.
 * GET /api/finnegans/hojas-ruta/:id
 */
const getDetalleHojaRuta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de hoja de ruta requerido.' });
        }

        const detalle = await finnegans.getDetalleHojaRuta(id);
        res.json(detalle);
    } catch (error) {
        console.error('[Finnegans] Error obteniendo detalle de hoja de ruta:', error.message);
        res.status(500).json({
            error: 'Error obteniendo detalle de hoja de ruta.',
            detalle: error.message
        });
    }
};

module.exports = {
    buscarEnvios,
    getHojasRuta,
    getDetalleHojaRuta,
    buscarHojasRutaRango,
    getRemitosHojaRuta
};
