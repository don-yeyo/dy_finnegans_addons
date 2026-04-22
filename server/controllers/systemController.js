/**
 * Devuelve la versión actual del backend.
 * GET /api/system/version
 */
const getVersion = (req, res) => {
    const pkg = require('../package.json');
    const clientVersion = req.query.v;

    const response = {
        serverVersion: pkg.version,
        needsUpdate: clientVersion ? pkg.version !== clientVersion : false
    };

    res.json(response);
};

module.exports = {
    getVersion
};
