const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the current directory
app.use(express.static('.', {
    // Set proper MIME types for JavaScript modules and model files
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
        if (path.endsWith('.bin')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        // Add CORS headers for model files
        if (path.includes('/models/')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
    }
}));

// Handle SPA routing - serve index.html for any non-file requests
app.get('*', (req, res) => {
    // Check if the request is for a file (has an extension)
    const hasExtension = path.extname(req.path) !== '';
    
    if (hasExtension) {
        // If file doesn't exist, return 404
        const filePath = path.join(__dirname, req.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }
        // Let express.static handle it
        return res.status(404).send('File not found');
    } else {
        // Serve index.html for routes without extensions
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔄 Auto-reload enabled - watching for file changes...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down development server...');
    process.exit(0);
});