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
        // Parametr s aktuálním časem zaručí, že stáhneme pokaždé nová data
        const url = `https://saraksti.lv/gpsdata.ashx?gps&_=${Date.now()}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://saraksti.lv/riga/'
            },
            timeout: 15000
        });

        const rawData = response.data;
        const mapData = [];
        
        // Data nám chodí jako text, musíme je rozsekat po řádcích
        const lines = typeof rawData === 'string' ? rawData.split('\n') : [];

        lines.forEach(line => {
            const cols = line.trim().split(',');
            
            // Každý správný řádek musí mít dostatek sloupečků
            if (cols.length < 8) return; 

            // Získání dat z konkrétních sloupců (podle vašeho vzorku)
            const linka = cols[1];
            const lngRaw = parseInt(cols[2], 10);
            const latRaw = parseInt(cols[3], 10);
            const vehicleId = cols[7]; // Evidenční číslo

            // Ochrana před chybami
            if (!latRaw || !lngRaw || !vehicleId) return;

            // Vrácení desetinné čárky do souřadnic
            const lat = latRaw / 1000000;
            const lng = lngRaw / 1000000;

            // Spárování s vaší databází vozů podle čísla
            const dbInfo = vehicleDb[vehicleId] || { typ: "Neznámý typ", trakce: "Neznámá" };

            mapData.push({
                id: vehicleId,
                lat: lat,
                lng: lng,
                linka: linka,
                rychlost: 0, // V těchto zkrácených datech rychlost neposílají, proto bude 0
                typ: dbInfo.typ,
                trakce: dbInfo.trakce
            });
        });

        res.json(mapData);
    } catch (error) {
        console.error("Chyba při stahování GPS dat z webu:", error.message);
        res.json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
