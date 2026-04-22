const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
        this.enviosReport = process.env.FINNEGANS_ENVIOS_REPORT || 'ANAHOJADERUTADY';
        this.hojasRutaReport = process.env.FINNEGANS_HOJAS_RUTA_REPORT || 'ANAHOJADERUTADY';

        this._accessToken = null;
        this._tokenExpiry = null;
    }

    /**
     * Helper para imprimir el equivalente a cURL de la petición (para debug).
     */
    _logCurl(url, params = {}, method = 'GET') {
        const query = new URLSearchParams(params).toString();
        const fullUrl = query ? `${url}?${query}` : url;
        const logContent = `\n[${new Date().toISOString()}] --- FINNEGANS cURL DEBUG ---\ncurl -X ${method} "${fullUrl}"\n----------------------------\n`;
        
        console.log(logContent);
        
        try {
            fs.appendFileSync(path.join(__dirname, '../debug.log'), logContent);
        } catch (e) {
            console.error('Error escribiendo en debug.log:', e.message);
        }
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

        console.log(`[Finnegans] Solicitando nuevo Access Token a: ${this.tokenUrl}`);
        const response = await axios.get(`${this.tokenUrl}?${params.toString()}`, {
            timeout: this.timeout
        });

        // Finnegans devuelve el token como texto plano
        this._accessToken = response.data.toString().trim();
        console.log('[Finnegans] Token obtenido exitosamente.');
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
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }

    /**
     * Busca envíos/hojas en Finnegans.
     */
    async buscarEnvios(filtro = {}) {
        const params = {};

        if (filtro.numero) {
            params.PARAMNumeroEnvio = filtro.numero;
        }
        if (filtro.fechaDesde) {
            params.FechaDesde = filtro.fechaDesde; 
        }
        if (filtro.fechaHasta) {
            params.FechaHasta = filtro.fechaHasta;
        }
        if (this.empresaCod) {
            params.PARAMWEBREPORT_Empresa = this.empresaCod;
        }

        return this.executeReport(this.enviosReport, params);
    }

    /**
     * Busca Hojas de Ruta en un rango de días hacia atrás.
     * @param {number} dias - Cantidad de días hacia atrás desde hoy
     * @returns {Array} Lista de Hojas de Ruta
     */
    async buscarHojasRutaRango(dias = 5) {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - dias);

        const fechaDesde = pastDate.toISOString().split('T')[0];
        const fechaHasta = today.toISOString().split('T')[0];
        console.log(`[Finnegans] Buscando en rango: ${fechaDesde} hasta ${fechaHasta}`);

        return this.buscarEnvios({ fechaDesde, fechaHasta });
    }

    /**
     * Obtiene los remitos vinculados a una Hoja de Ruta.
     * @param {string|number} hojaRutaId - ID o Comprobante de la HR
     * @returns {Array} Lista de remitos con detalle (Cliente, Pedido, etc.)
     */
    async getRemitosHojaRuta(hojaRutaId) {
        // En Don Yeyo, los remitos se vinculan a la HR mediante la descripción
        // en el reporte analisisDespachos (que contiene el detalle de ítems)
        const report = 'analisisDespachos';
        const params = {
            PARAMWEBREPORT_Empresa: this.empresaCod,
            // Ampliamos un poco el rango para asegurar que aparezcan
            PARAMWEBREPORT_FechaDesde: '2024-01-01',
            PARAMWEBREPORT_FechaHasta: '2026-12-31'
        };

        try {
            console.log(`[Finnegans] Buscando remitos para HR ${hojaRutaId} en ${report}...`);
            const data = await this.executeReport(report, params);
            
            if (!Array.isArray(data)) return [];

            // Limpiamos el ID para la búsqueda (ej: de "HOJARUTA - 20887" a "20887")
            const numeroSolo = String(hojaRutaId).replace(/[^0-9]/g, '');

            // Filtramos los registros que mencionen esta Hoja de Ruta en su DESCRIPCION
            const remitosUnicos = {};
            
            data.forEach(d => {
                const desc = String(d.DESCRIPCION || '').toUpperCase();
                if (desc.includes(numeroSolo) && desc.includes('HOJARUTA')) {
                    const comp = d.COMPROBANTE || d.DESPACHO;
                    if (comp && !remitosUnicos[comp]) {
                        remitosUnicos[comp] = {
                            id: d.TRANSACCIONID,
                            cliente: d.CLIENTE || d.PROVEEDOR,
                            pedidoTipo: d.TRANSACCONSUBTIPONOMBRE || 'REMVTA',
                            pedidoNro: d.DOCNROINT || d.IDENTIFICACIONEXTERNA,
                            comprobante: comp,
                            fecha: d.FECHA,
                            despacho: comp
                        };
                    }
                }
            });

            const results = Object.values(remitosUnicos);
            console.log(`[Finnegans] Se encontraron ${results.length} remitos vinculados únicos.`);
            return results;

        } catch (e) {
            console.error(`[Finnegans] Error buscando remitos para HR ${hojaRutaId}:`, e.message);
            return [];
        }
    }

    /**
     * Obtiene las hojas de ruta asociadas a un envío.
     * @param {string|number} envioId - ID o número del envío
     * @returns {Array} Lista de hojas de ruta
     */
    async getHojasDeRuta(envioId) {
        const params = {
            PARAMEnvioId: envioId,
            PARAMWEBREPORT_Empresa: this.empresaCod
        };

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

        const queryParams = { ACCESS_TOKEN: token };
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
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

        const queryParams = { ACCESS_TOKEN: token, ...params };
        this._logCurl(url, queryParams);

        const response = await axios.get(url, {
            params: queryParams,
            timeout: this.timeout
        });

        return response.data;
    }
}

module.exports = FinnegansService;
