const FinnegansService = require('../services/finnegansService');

const finnegans = new FinnegansService();

/**
 * Buscar envíos en Finnegans.
 * GET /api/finnegans/envios?numero=XXX&fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
 */
const buscarEnvios = async (req, res) => {
    try {
        const { numero, fechaDesde, fechaHasta } = req.query;

        if (!numero && !fechaDesde) {
            return res.status(400).json({
                error: 'Debe proporcionar al menos un número de envío o una fecha desde.'
            });
        }

        const resultados = await finnegans.buscarEnvios({ numero, fechaDesde, fechaHasta });
        res.json(resultados);
    } catch (error) {
        console.error('[Finnegans] Error buscando envíos:', error.message);
        res.status(500).json({
            error: 'Error consultando envíos en Finnegans.',
            detalle: error.message
        });
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
    getDetalleHojaRuta
};
