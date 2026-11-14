const express = require('express');
const cors = require('cors');
const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public')); // Zpřístupní web pro telefon

// Načtení databáze
const vehicleDb = JSON.parse(fs.readFileSync('vehicles.json', 'utf8'));

// Sem v budoucnu vložíte reálnou adresu z Riga Open Data portálu
const GTFS_RT_URL = 'https://saraksti.rigassatiksme.lv/interfaces/gtfs-rt/vehicle_positions';

app.get('/api/vehicles', async (req, res) => {
    try {
        const response = await axios.get(GTFS_RT_URL, { responseType: 'arraybuffer' });
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(response.data));
        const mapData = [];

        feed.entity.forEach((entity) => {
            if (entity.vehicle && entity.vehicle.vehicle) {
                const vehicleId = entity.vehicle.vehicle.id;
                const dbInfo = vehicleDb[vehicleId] || { typ: "Neznámý typ", trakce: "Neznámá" };

                mapData.push({
                    id: vehicleId,
                    lat: entity.vehicle.position.latitude,
                    lng: entity.vehicle.position.longitude,
                    linka: entity.vehicle.trip ? entity.vehicle.trip.routeId : "N/A",
                    rychlost: entity.vehicle.position.speed || 0,
                    typ: dbInfo.typ,
                    trakce: dbInfo.trakce
                });
            }
        });
        res.json(mapData);
    } catch (error) {
        console.error("Chyba GTFS dat:", error.message);
        // Fallback ukázková data pro testování, dokud nemáte ostrou URL
        res.json([]);
    }
});

// Zajištění fungování na portu, který přidělí Glitch
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
