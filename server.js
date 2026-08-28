const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve level-select.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'level-select.html'));
});

// Serve the game page
app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧟 Zombie Survival Shooter running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
});
