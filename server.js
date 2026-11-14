const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

const vehicleDb = JSON.parse(fs.readFileSync('vehicles.json', 'utf8'));

app.get('/api/vehicles', async (req, res) => {
    try {
        // Voláme Rigu napřímo s klíčovou hlavičkou, která odemkne data
        const response = await axios.get('https://saraksti.lv/gpsdata.ashx?gps', {
            headers: {
                'Origin-Custom': 'saraksti.lv',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const rawText = response.data;
        const mapData = [];
        
        // Zpracování textu z Rigy
        const lines = typeof rawText === 'string' ? rawText.split('\n') : [];
        
        lines.forEach(line => {
            const cols = line.trim().split(',');
            if (cols.length < 8) return; 

            const linka = cols[1];
            const lngRaw = parseInt(cols[2], 10);
            const latRaw = parseInt(cols[3], 10);
            const vehicleId = cols[7];

            if (!latRaw || !lngRaw || !vehicleId) return;

            const lat = latRaw / 1000000;
            const lng = lngRaw / 1000000;
            const dbInfo = vehicleDb[vehicleId] || { typ: "Neznámý typ", trakce: "Neznámá" };

            mapData.push({ id: vehicleId, lat, lng, linka, rychlost: 0, typ: dbInfo.typ, trakce: dbInfo.trakce });
        });

        res.json(mapData);
    } catch (error) {
        console.error("Chyba spojení s Rigou:", error.message);
        res.status(500).json({ error: "Nelze stáhnout data z Rigy." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
