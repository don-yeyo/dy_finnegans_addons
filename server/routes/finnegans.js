const express = require('express');
const router = express.Router();
const { 
    buscarEnvios, 
    getHojasRuta, 
    getDetalleHojaRuta,
    buscarHojasRutaRango,
    getRemitosHojaRuta,
    getDetalleRemitoCOT
} = require('../controllers/finnegansController');

// Bucar hojas por rango de días
router.get('/hojas-ruta/rango', buscarHojasRutaRango);

// Obtener remitos asociados a una hoja
router.get('/hojas-ruta/:id/remitos', getRemitosHojaRuta);

// Detalle extendido para COT
router.get('/remitos/:id/detalle-cot', getDetalleRemitoCOT);

// Buscar envíos por número o rango de fechas
router.get('/envios', buscarEnvios);

// Obtener hojas de ruta de un envío
router.get('/envios/:id/hojas-ruta', getHojasRuta);

// Detalle de una hoja de ruta específica
router.get('/hojas-ruta/:id', getDetalleHojaRuta);

module.exports = router;
