const { serveHTTP } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

serveHTTP(addonInterface, {
  port: process.env.PORT || 80,
  hostname: "0.0.0.0", // Required for remote access
});

console.log("Addon is accessible via GitHub raw URL.");
