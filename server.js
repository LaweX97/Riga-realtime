const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Načtení vaší databáze vozidel
const vehicleDb = JSON.parse(fs.readFileSync('vehicles.json', 'utf8'));

// Nová adresa, přes kterou si telefon stáhne jen vaši databázi typů
app.get('/api/db', (req, res) => {
    res.json(vehicleDb);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend běží na portu ${PORT}`);
});
