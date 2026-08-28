const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Redirect root to level select BEFORE static middleware
app.get('/', (req, res) => {
    res.redirect('/level-select.html');
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the game page at /game.html (maps to index.html)
app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧟 Zombie Survival Shooter running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
});
