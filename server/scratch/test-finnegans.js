require('dotenv').config();
const axios = require('axios');

async function testConnection() {
    console.log('--- Listado de Dimensiones ---');
    try {
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.FINNEGANS_CLIENT_ID,
            client_secret: process.env.FINNEGANS_CLIENT_SECRET
        });

        const tokenRes = await axios.get(`${process.env.FINNEGANS_TOKEN_URL}?${params.toString()}`);
        const token = tokenRes.data.toString().trim();

        const url = `${process.env.FINNEGANS_API_BASE}/BSA/api/dimension/list`;
        
        try {
            const res = await axios.get(url, {
                params: { ACCESS_TOKEN: token },
                timeout: 10000
            });
            
            if (Array.isArray(res.data)) {
                console.log('Dimensiones encontradas:', res.data.length);
                const query = 'HOJA';
                const found = res.data.filter(d => d.nombre.toUpperCase().includes(query) || d.id.toUpperCase().includes(query));
                console.log(`Búsqueda "${query}":`, found);
            }
        } catch (e) {
             console.error(`❌ Error:`, e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

testConnection();
