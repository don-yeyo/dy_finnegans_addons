/**
 * ArbaService — Generación de archivo TXT para COT ARBA
 * 
 * Formato basado en la especificación oficial:
 *   docs/COTnuevodiseniodearchivotxt.pdf
 * 
 * Tipos de registro:
 *   01 = HEADER   (13 chars)
 *   02 = REMITO   (715 chars)
 *   03 = PRODUCTO (124 chars)
 *   04 = FOOTER   (12 chars)
 * 
 * Reglas generales:
 *   - Campos A (alfanuméricos): left-justified, padded con espacios a la derecha
 *   - Campos N (numéricos): right-justified, padded con ceros a la izquierda
 *   - Decimales implícitos (últimos 2 dígitos) sin punto/coma
 *   - Separador de línea: CRLF
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ArbaService {
    constructor() {
        this.cotUrl = process.env.ARBA_COT_URL;
        this.cotUser = process.env.ARBA_COT_USER;
        this.cotPassword = process.env.ARBA_COT_PASSWORD;
        this.cuitEmpresa = process.env.ARBA_CUIT_EMPRESA;
        this.saveLocal = process.env.ARBA_SAVE_LOCAL === 'true';
        this.localPath = process.env.ARBA_LOCAL_PATH || './txts';
    }

    // ============================================================
    //  Utilidades de formateo según especificación ARBA
    // ============================================================

    /** Campo alfanumérico: left-justified, padded con espacios */
    _padA(value, length) {
        const str = String(value || '');
        return str.substring(0, length).padEnd(length, ' ');
    }

    /** Campo numérico: right-justified, padded con ceros */
    _padN(value, length) {
        const num = String(value || '0').replace(/\D/g, '');
        return num.substring(0, length).padStart(length, '0');
    }

    /** Formatea importe: 12 enteros + 2 decimales implícitos = 14 chars */
    _formatImporte(valor) {
        const num = parseFloat(valor || 0);
        const cents = Math.round(num * 100);
        return this._padN(String(cents), 14);
    }

    /** Formatea cantidad: 13 enteros + 2 decimales implícitos = 15 chars */
    _formatCantidad(valor) {
        const num = parseFloat(valor || 0);
        const cents = Math.round(num * 100);
        return this._padN(String(cents), 15);
    }

    /** Formatea fecha de Date o string a AAAAMMDD */
    _formatFecha(fecha) {
        if (!fecha) return this._padN('0', 8);
        // Si ya viene como AAAA-MM-DD
        if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
            return fecha.substring(0, 10).replace(/-/g, '');
        }
        const d = new Date(fecha);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    }

    /** Formatea hora HH:MM o HH:MM:SS a HHMM */
    _formatHora(hora) {
        if (!hora) return '0000';
        const clean = String(hora).replace(/:/g, '');
        return this._padN(clean.substring(0, 4), 4);
    }

    // ============================================================
    //  Generación de registros según especificación
    // ============================================================

    /**
     * Registro 01: HEADER (13 chars)
     * Pos 1-2:   TIPO_REGISTRO = '01'
     * Pos 3-13:  CUIT_EMPRESA (11N)
     */
    _generarHeader() {
        let line = '';
        line += this._padA('01', 2);                          // TIPO_REGISTRO
        line += this._padN(this.cuitEmpresa, 11);             // CUIT_EMPRESA
        return line; // Total: 13 chars
    }

    /**
     * Registro 02: REMITO (715 chars)
     * Contiene datos del remito, origen, destino, transportista.
     */
    _generarRemito(remito) {
        let line = '';

        // Tipo registro
        line += this._padA('02', 2);                                                       // 1-2

        // Fechas y código
        line += this._padA(this._formatFecha(remito.fechaEmision), 8);                     // 3-10   FECHA_EMISION
        line += this._padA(remito.codigoUnico || '', 16);                                  // 11-26  CODIGO_UNICO (3 AFIP + 5 Prefijo + 8 Número)
        line += this._padN(this._formatFecha(remito.fechaSalida || remito.fechaPartida), 8); // 27-34  FECHA_SALIDA_TRANSPORTE
        line += this._padN(this._formatHora(remito.horaSalida || remito.horaPartida), 4);  // 35-38  HORA_SALIDA_TRANSPORTE

        // Sujeto generador
        line += this._padA(remito.sujetoGenerador || 'E', 1);                              // 39     SUJETO_GENERADOR (E=Emisor)

        // Destinatario
        const esCF = remito.destinatarioConsumidorFinal ? '1' : '0';
        line += this._padN(esCF, 1);                                                        // 40     DESTINATARIO_CONSUMIDOR_FINAL
        line += this._padA(remito.destTipoDoc || '', 3);                                   // 41-43  DEST_TIPO_DOCUMENTO
        line += this._padN(remito.destDocumento || '', 11);                                // 44-54  DEST_DOCUMENTO
        line += this._padN(remito.cuitDestinatario || '', 11);                             // 55-65  DEST_CUIT
        line += this._padA(remito.razonSocialDestinatario || '', 50);                      // 66-115 DEST_RAZON_SOCIAL
        line += this._padN(remito.destTenedor || '0', 1);                                  // 116    DEST_TENEDOR

        // Domicilio destino
        line += this._padA(remito.destinoCalle || '', 40);                                 // 117-156 DESTINO_CALLE
        line += this._padN(remito.destinoNumero || '0', 5);                                // 157-161 DESTINO_NUMERO
        line += this._padA(remito.destinoComple || '', 5);                                 // 162-166 DESTINO_COMPLEMENTO
        line += this._padA(remito.destinoPiso || '', 3);                                   // 167-169 DESTINO_PISO
        line += this._padA(remito.destinoDto || '', 4);                                    // 170-173 DESTINO_DTO
        line += this._padA(remito.destinoBarrio || '', 30);                                // 174-203 DESTINO_BARRIO
        line += this._padA(remito.destinoCP || '', 8);                                     // 204-211 DESTINO_CP
        line += this._padA(remito.destinoLocalidad || '', 50);                             // 212-261 DESTINO_LOCALIDAD
        line += this._padA(remito.destinoProvincia || 'B', 1);                             // 262    DESTINO_PROVINCIA

        // Propio destino código
        line += this._padA(remito.propioDestCod || '', 20);                                // 263-282 PROPIO_DEST_COD

        // Entrega en domicilio origen
        line += this._padA(remito.entregaDomOrigen || 'NO', 2);                            // 283-284 ENTREGA_DOM_ORIGEN

        // Origen
        line += this._padN(remito.origenCuit || this.cuitEmpresa, 11);                                      // 285-295 ORIGEN_CUIT
        line += this._padA(remito.origenRazonSocial || '', 50);                            // 296-345 ORIGEN_RAZON_SOCIAL
        line += this._padN(remito.emisorTenedor || '1', 1);                                // 346    EMISOR_TENEDOR

        // Domicilio origen
        line += this._padA(remito.origenCalle || '', 40);                                  // 347-386 ORIGEN_CALLE
        line += this._padN(remito.origenNumero || '0', 5);                                 // 387-391 ORIGEN_NUMERO
        line += this._padA(remito.origenComple || '', 5);                                  // 392-396 ORIGEN_COMPLEMENTO
        line += this._padA(remito.origenPiso || '', 3);                                    // 397-399 ORIGEN_PISO
        line += this._padA(remito.origenDto || '', 4);                                     // 400-403 ORIGEN_DTO
        line += this._padA(remito.origenBarrio || '', 30);                                 // 404-433 ORIGEN_BARRIO
        line += this._padA(remito.origenCP || '', 8);                                      // 434-441 ORIGEN_CP
        line += this._padA(remito.origenLocalidad || '', 50);                              // 442-491 ORIGEN_LOCALIDAD
        line += this._padA(remito.origenProvincia || 'B', 1);                              // 492    ORIGEN_PROVINCIA

        // Transportista
        line += this._padN(remito.cuitTransportista || '', 11);                            // 493-503 TRANSPORT_CUIT

        // Recorrido
        line += this._padA(remito.tipoRecorrido || '', 1);                                 // 504    TIPO_RECORRIDO
        line += this._padA(remito.recorridoLocalidad || '', 50);                           // 505-554 RECOR_LOCALIDAD
        line += this._padA(remito.recorridoCalle || '', 40);                               // 555-594 RECOR_CALLE
        line += this._padA(remito.recorridoRuta || '', 40);                                // 595-634 RECOR_RUTA

        // Patentes
        line += this._padA(remito.patente || '', 7);                                       // 635-641 PATENTE_VEHICULO
        line += this._padA(remito.patenteAcoplado || '', 7);                               // 642-648 PATENTE_ACOPLADO

        // Producto no terminado / devuelto
        line += this._padN(remito.prodNoTermDev || '0', 1);                                // 649    PROD_NO_TERM_DEV

        // Razón social transportista
        line += this._padA(remito.razonSocialTransportista || '', 50);                     // 650-699 TRANSPORT_RAZON

        // Importe total (sin IVA, sin impuestos internos)
        line += this._formatImporte(remito.importeTotal || 0);                             // 700-713 IMPORTE_TOTAL (14N: 12+2 dec)

        // Tipo emisor e indicador diferimiento
        line += this._padA(remito.tipoEmisor || 'E', 1);                                  // 714    TIPO_EMISOR
        line += this._padA(remito.indicDiferImp || 'N', 1);                                // 715    INDIC_DIFER_IMP

        return line; // Total: 715 chars
    }

    /**
     * Registro 03: PRODUCTOS (124 chars)
     */
    _generarProducto(producto) {
        let line = '';
        line += this._padA('03', 2);                                                       // 1-2   TIPO_REGISTRO
        line += this._padA(producto.codUnicoProducto || producto.codigoNCM || '', 6);      // 3-8   COD_UNICO_PROD (Nomenclador COT)
        line += this._padA(producto.codUnidadMedida || 'K', 1);                            // 9     ARBA_COD_UNIDAD_MEDIDA
        line += this._formatCantidad(producto.cantidad || 0);                               // 10-24  CANTIDAD (15N: 13+2 dec)
        line += this._padA(producto.codigoPropio || producto.codigo || '', 25);             // 25-49  PROPIO_COD_PROD
        line += this._padA(producto.descripcion || '', 40);                                // 50-89  PROPIO_DESC_PROD
        line += this._padA(producto.unidadDescripcion || producto.unidad || 'UNIDAD', 20); // 90-109 PROPIO_DESC_UNIDAD
        line += this._formatCantidad(producto.cantidadAjustada || producto.cantidad || 0);  // 110-124 CANTIDAD_AJUSTADA

        return line; // Total: 124 chars
    }

    /**
     * Registro 04: FOOTER (12 chars)
     */
    _generarFooter(cantidadRemitos) {
        let line = '';
        line += this._padA('04', 2);                                                       // 1-2   TIPO_REGISTRO
        line += this._padN(cantidadRemitos, 10);                                           // 3-12  CANT_TOTAL_REMITOS
        return line; // Total: 12 chars
    }

    // ============================================================
    //  API Pública
    // ============================================================

    /**
     * Genera el contenido completo del archivo TXT para COT.
     * @param {Object} data - Datos del remito y sus productos
     * @returns {{ contenido: string, nombreArchivo: string, lineas: number, tamaño: number }}
     */
    generarArchivoCOT(data) {
        const lineas = [];

        // 01 - HEADER
        lineas.push(this._generarHeader());

        // 02 - REMITO(s) + 03 - PRODUCTO(s) por cada remito
        const remitos = Array.isArray(data.remitos) ? data.remitos : [data];
        for (const remito of remitos) {
            lineas.push(this._generarRemito(remito));

            const productos = remito.productos || data.productos || [];
            for (const prod of productos) {
                lineas.push(this._generarProducto(prod));
            }
        }

        // 04 - FOOTER
        lineas.push(this._generarFooter(remitos.length));

        const contenido = lineas.join('\r\n');
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const nombreArchivo = `COT_${this.cuitEmpresa}_${ts}.txt`;
        const contenidoFinal = contenido + '\r\n'; // Asegurar CRLF final

        if (this.saveLocal) {
            this._guardarArchivoLocal(contenidoFinal, nombreArchivo);
        }

        return {
            contenido: contenidoFinal,
            nombreArchivo,
            lineas: lineas.length,
            tamaño: Buffer.byteLength(contenidoFinal, 'latin1')
        };
    }

    /**
     * Guarda el archivo TXT localmente para auditoría o debugging.
     */
    _guardarArchivoLocal(contenido, nombreArchivo) {
        try {
            const dir = path.resolve(this.localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const filePath = path.join(dir, nombreArchivo);
            fs.writeFileSync(filePath, contenido, 'latin1');
            console.log(`[ARBA] Archivo guardado localmente: ${filePath}`);
        } catch (error) {
            console.error(`[ARBA] Error guardando archivo local: ${error.message}`);
        }
    }

    /**
     * Envía el archivo COT a ARBA por HTTP multipart/form-data.
     * @param {string} contenido   - Contenido del archivo TXT
     * @param {string} nombreArchivo - Nombre del archivo
     * @returns {Object} Respuesta de ARBA
     */
    async enviarCOT(contenido, nombreArchivo) {
        if (!this.cotUrl || !this.cotUser || !this.cotPassword) {
            throw new Error('Faltan credenciales de ARBA (ARBA_COT_URL, ARBA_COT_USER, ARBA_COT_PASSWORD)');
        }

        // ARBA espera las credenciales en la URL (Query String)
        const urlConAuth = `${this.cotUrl}?user=${this.cotUser}&password=${this.cotPassword}`;

        const form = new FormData();
        form.append('archivo', Buffer.from(contenido, 'latin1'), {
            filename: nombreArchivo,
            contentType: 'text/plain'
        });

        // Debug cURL corregido
        console.log('\n[ARBA] --- cURL DEBUG (Corregido) ---');
        console.log(`curl -X POST "${urlConAuth}" \\`);
        console.log(`  -F "archivo=@${nombreArchivo};type=text/plain"`);
        console.log('-------------------------------------\n');

        const response = await axios.post(urlConAuth, form, {
            headers: form.getHeaders(),
            timeout: parseInt(process.env.ARBA_TIMEOUT || '60') * 1000,
        });

        return this._parsearRespuestaARBA(response.data);
    }

    /**
     * Parsea la respuesta XML de ARBA.
     * La respuesta puede contener tags como <numeroCOT>, <codigoError>, etc.
     */
    _parsearRespuestaARBA(responseData) {
        const data = String(responseData);

        // Extraer campos comunes de la respuesta
        const extract = (tag) => {
            const match = data.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
            return match ? match[1].trim() : null;
        };

        const nroCOT = extract('numeroCOT') || extract('nroCOT');
        const codigoError = extract('codigoError');
        const descripcionError = extract('descripcionError') || extract('mensaje');

        if (nroCOT && !codigoError) {
            return {
                success: true,
                nroCOT,
                rawResponse: data
            };
        }

        return {
            success: false,
            nroCOT: null,
            errores: [{
                codigo: codigoError || 'UNKNOWN',
                descripcion: descripcionError || 'Error desconocido en la respuesta de ARBA'
            }],
            rawResponse: data
        };
    }
}

module.exports = ArbaService;
