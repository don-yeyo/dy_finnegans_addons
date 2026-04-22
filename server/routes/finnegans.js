const express = require('express');
const router = express.Router();
const { buscarEnvios, getHojasRuta, getDetalleHojaRuta } = require('../controllers/finnegansController');

// Buscar envíos por número o rango de fechas
router.get('/envios', buscarEnvios);

// Obtener hojas de ruta de un envío
router.get('/envios/:id/hojas-ruta', getHojasRuta);

// Detalle de una hoja de ruta específica
router.get('/hojas-ruta/:id', getDetalleHojaRuta);

module.exports = router;
