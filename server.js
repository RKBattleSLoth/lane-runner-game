const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve level-select.html
app.get('/level-select.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'level-select.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧟 Zombie Survival Shooter running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
});
