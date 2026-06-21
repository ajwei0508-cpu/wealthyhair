const fs = require('fs');
const https = require('https');

const DID_API_KEY = "YWp3ZWkwNTA4QGdtYWlsLmNvbQ:MRbV4pRuSBmdNqHi9l4n6";
const DID_AUTH = "Basic " + Buffer.from(DID_API_KEY).toString('base64');

const req = https.request('https://api.d-id.com/images', {
  method: 'POST',
  headers: {
    'Authorization': DID_AUTH,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', console.error);
req.end();
