const axios = require('axios');

/**
 * FinnegansService — Port a Node.js del servicio Python existente.
 * Maneja autenticación OAuth y consultas a la API de Finnegans ERP.
 * Todos los endpoints son configurables por variable de entorno.
 */
class FinnegansService {
    constructor() {
        this.clientId = process.env.FINNEGANS_CLIENT_ID;
        this.clientSecret = process.env.FINNEGANS_CLIENT_SECRET;
        this.tokenUrl = process.env.FINNEGANS_TOKEN_URL || 'https://api.teamplace.finneg.com/api/oauth/token';
        this.apiBase = process.env.FINNEGANS_API_BASE || 'https://api.finneg.com/api';
        this.empresaCod = process.env.FINNEGANS_EMPRESA_COD || 'EMPRE01';
        this.timeout = (parseInt(process.env.FINNEGANS_TIMEOUT) || 30) * 1000;
        this.enviosReport = process.env.FINNEGANS_ENVIOS_REPORT || 'APICONSULTAENVIOSDY';
        this.hojasRutaReport = process.env.FINNEGANS_HOJAS_RUTA_REPORT || 'APICONSULTAHOJASRUTADY';

        this._accessToken = null;
        this._tokenExpiry = null;
    }

    /**
     * Obtiene un access token OAuth2 (client_credentials).
     * Cachea el token para reutilizarlo hasta que expire.
     */
    async _getAccessToken() {
        // Reutilizar token si aún es válido (margen de 60s)
        if (this._accessToken && this._tokenExpiry && Date.now() < this._tokenExpiry - 60000) {
            return this._accessToken;
        }

        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        const response = await axios.get(`${this.tokenUrl}?${params.toString()}`, {
            timeout: this.timeout
        });

        // Finnegans devuelve el token como texto plano
        this._accessToken = response.data.toString().trim();
        // Token válido por 1 hora (default Finnegans)
        this._tokenExpiry = Date.now() + 3600000;
        return this._accessToken;
    }

    /**
     * Ejecuta un reporte de Finnegans con los parámetros dados.
     * @param {string} reportName - Nombre del reporte en Finnegans
     * @param {Object} params - Parámetros del reporte (PARAMxxx)
     * @returns {Array} Resultados del reporte
     */
    async executeReport(reportName, params = {}) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/reports/${reportName}`;

        const queryParams = {
            ACCESS_TOKEN: token,
            ...params
        };

        console.log(`[Finnegans] Ejecutando reporte: ${reportName}`);
        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }

    /**
     * Busca envíos en Finnegans.
     * @param {Object} filtro - Filtros de búsqueda
     * @param {string} filtro.numero - Número de envío
     * @param {string} filtro.fechaDesde - Fecha desde (YYYY-MM-DD)
     * @param {string} filtro.fechaHasta - Fecha hasta (YYYY-MM-DD)
     * @returns {Array} Lista de envíos encontrados
     */
    async buscarEnvios(filtro = {}) {
        const params = {};

        if (filtro.numero) {
            params.PARAMNumeroEnvio = filtro.numero;
        }
        if (filtro.fechaDesde) {
            params.PARAMFechaDesde = filtro.fechaDesde;
        }
        if (filtro.fechaHasta) {
            params.PARAMFechaHasta = filtro.fechaHasta;
        }
        if (this.empresaCod) {
            params.PARAMEmpresaCodigo = this.empresaCod;
        }

        return this.executeReport(this.enviosReport, params);
    }

    /**
     * Obtiene las hojas de ruta asociadas a un envío.
     * @param {string|number} envioId - ID o número del envío
     * @returns {Array} Lista de hojas de ruta
     */
    async getHojasDeRuta(envioId) {
        const params = {
            PARAMEnvioId: envioId
        };

        if (this.empresaCod) {
            params.PARAMEmpresaCodigo = this.empresaCod;
        }

        return this.executeReport(this.hojasRutaReport, params);
    }

    /**
     * Obtiene el detalle completo de una hoja de ruta.
     * @param {string|number} hojaRutaId - ID de la hoja de ruta
     * @returns {Object} Detalle de la hoja de ruta
     */
    async getDetalleHojaRuta(hojaRutaId) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/transaccion/${hojaRutaId}`;

        const response = await axios.get(url, {
            params: { ACCESS_TOKEN: token },
            timeout: this.timeout
        });

        return response.data;
    }

    /**
     * Consulta genérica a la API de Finnegans.
     * Útil para endpoints no cubiertos por los métodos específicos.
     * @param {string} endpoint - Path relativo al apiBase
     * @param {Object} params - Query params adicionales
     * @returns {any} Respuesta de la API
     */
    async query(endpoint, params = {}) {
        const token = await this._getAccessToken();
        const url = `${this.apiBase}/${endpoint}`;

        const response = await axios.get(url, {
            params: { ACCESS_TOKEN: token, ...params },
            timeout: this.timeout
        });

        return response.data;
    }
}

module.exports = FinnegansService;
