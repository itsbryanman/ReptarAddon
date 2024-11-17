#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

// Serve the add-on on all network interfaces (external access)
serveHTTP(addonInterface, {
    port: process.env.PORT || 60761, // Use the PORT environment variable or default to 60761
    hostname: "0.0.0.0" // Bind to all interfaces for public access
});

///When you've deployed your add-on, un-comment this line to publish it to the central Stremio catalog
// Replace "http://65.109.147.17:60761/manifest.json" with your public URL
publishToCentral("http://65.109.147.17:60761/manifest.json");

// For more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
