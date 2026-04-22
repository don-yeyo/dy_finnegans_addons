const express = require('express');
const router = express.Router();
const { getVersion } = require('../controllers/systemController');

router.get('/version', getVersion);

module.exports = router;
