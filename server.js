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
        // Cílová adresa s aktuálním časem
        const targetUrl = `https://saraksti.lv/gpsdata.ashx?gps&_=${Date.now()}`;
        // Použití proxy AllOrigins, která maskuje cloudové servery
        const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

        console.log("Stahuji data z:", url);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });

        const rawData = response.data;
        const mapData = [];
        
        const lines = typeof rawData === 'string' ? rawData.split('\n') : [];
        
        // Vypíšeme do logu prvních 100 znaků, abychom viděli, co reálně přišlo
        console.log(`Staženo řádků: ${lines.length}`);
        if (lines.length > 0) {
            console.log("Ukázka prvního řádku:", lines[0].substring(0, 100));
        }

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

            mapData.push({
                id: vehicleId,
                lat: lat,
                lng: lng,
                linka: linka,
                rychlost: 0,
                typ: dbInfo.typ,
                trakce: dbInfo.trakce
            });
        });

        console.log(`Úspěšně zpracováno vozidel: ${mapData.length}`);
        res.json(mapData);
    } catch (error) {
        console.error("Chyba při stahování GPS dat:", error.message);
        res.json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
