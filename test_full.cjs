const https = require('https');
const fs = require('fs');
const path = require('path');

const DID_API_KEY = "YWp3ZWkwNTA4QGdtYWlsLmNvbQ:MRbV4pRuSBmdNqHi9l4n6";
const DID_AUTH = "Basic " + Buffer.from(DID_API_KEY).toString('base64');

// Create a dummy image
const imagePath = path.join(__dirname, 'dummy.jpg');
fs.writeFileSync(imagePath, Buffer.from("dummy data"));

// We cannot easily do multipart/form-data in raw Node without a library.
// But wait, D-ID also accepts plain HTTP image URLs.
