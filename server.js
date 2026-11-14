const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

const vehicleDb = JSON.parse(fs.readFileSync('vehicles.json', 'utf8'));

// VLOŽTE ZDE VÁŠ ODKAZ Z GOOGLU (ten co končí na /exec)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzAllw6jklnjF--Vkc3HWJItAyKSvRUKuRZtllNi7Ece4YZcC_PXGlL7XSLMdBoURnw/exec';

app.get('/api/vehicles', async (req, res) => {
    try {
        // Náš Render server volá Google, čímž obejde ochranu v Safari
        const response = await axios.get(GOOGLE_SCRIPT_URL, { timeout: 15000 });
        const rawData = response.data;
        const mapData = [];
        
        const lines = typeof rawData === 'string' ? rawData.split('\n') : [];
        
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
        console.error("Chyba přes Google:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
