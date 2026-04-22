require('dotenv').config();
const axios = require('axios');

async function testConnection() {
    console.log('--- Analizando Estructura en analisisDespachos ---');
    try {
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.FINNEGANS_CLIENT_ID,
            client_secret: process.env.FINNEGANS_CLIENT_SECRET
        });

        const tokenRes = await axios.get(`${process.env.FINNEGANS_TOKEN_URL}?${params.toString()}`);
        const token = tokenRes.data.toString().trim();

        const report = 'analisisDespachos';
        const url = `${process.env.FINNEGANS_API_BASE}/reports/${report}`;
        
        const res = await axios.get(url, {
            params: {
                ACCESS_TOKEN: token,
                PARAMWEBREPORT_Empresa: process.env.FINNEGANS_EMPRESA_COD,
                PARAMWEBREPORT_FechaDesde: '2026-04-20',
                PARAMWEBREPORT_FechaHasta: '2026-04-25'
            }
        });

        const found = res.data.find(d => JSON.stringify(d).includes('20887'));
        if (found) {
            console.log('✅ Registro encontrado en analisisDespachos.');
            // Ver qué campos tienen el valor 20887
            for (let k in found) {
                if (String(found[k]).includes('20887')) {
                    console.log(`🔥 Campo identificado: ${k} = ${found[k]}`);
                }
            }
            console.log('Muestra completa:', JSON.stringify(found, null, 2));
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

testConnection();
