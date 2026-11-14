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
        // Dynamické vygenerování času zajistí, že dostaneme vždy nová data
        const timeParam = Date.now();
        const url = `https://saraksti.lv/gpsdata.ashx?stopid=3014&time=${timeParam}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://saraksti.lv/riga/'
            },
            timeout: 15000
        });

        const rawData = response.data;
        const mapData = [];
        
        // Zjištění struktury dat
        let vehicleList = [];
        if (Array.isArray(rawData)) {
            vehicleList = rawData;
        } else if (rawData && typeof rawData === 'object' && rawData.vehicles) {
            vehicleList = rawData.vehicles;
        } else if (typeof rawData === 'string') {
            console.error("Data přišla jako čistý text, ukázka pro úpravu kódu:", rawData.substring(0, 150));
        }

        vehicleList.forEach(v => {
            // Inteligentní párování názvů kolonek, ať už se jmenují jakkoliv
            const vehicleId = String(v.id || v.VehicleId || v.vehicleId || v.VehicleNo || v.vehicleno || "Neznámé");
            const lat = parseFloat(v.lat || v.Latitude || v.latitude || v.y || 0);
            const lng = parseFloat(v.lng || v.Longitude || v.longitude || v.x || 0);
            const linka = String(v.route || v.Route || v.routeId || v.line || "N/A");
            const rychlost = parseFloat(v.speed || v.Speed || 0);

            if (lat === 0 || lng === 0) return; // Ochrana před chybou GPS

            const dbInfo = vehicleDb[vehicleId] || { typ: "Neznámý typ", trakce: "Neznámá" };

            mapData.push({
                id: vehicleId,
                lat: lat,
                lng: lng,
                linka: linka,
                rychlost: rychlost,
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
