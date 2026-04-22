const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// rate-limit: Protección Anti-DOS (Máximo 1000 reqs / IP cada 15 min)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta en 15 minutos.' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Límite de carga útil HTTP de 2MB
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Aplicar rate-limit a todas las rutas de la API
app.use('/api', limiter);

// Routes
const finnegansRoutes = require('./routes/finnegans');
const cotRoutes = require('./routes/cot');
const systemRoutes = require('./routes/system');

app.use('/api/finnegans', finnegansRoutes);
app.use('/api/cot', cotRoutes);
app.use('/api/system', systemRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Finnegans Addons API - Don Yeyo S.A.' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
    console.log(`[Finnegans Addons] Server running on port ${PORT}`);
});

module.exports = app;
