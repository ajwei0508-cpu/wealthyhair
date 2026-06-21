const https = require('https');

const DID_API_KEY = "YWp3ZWkwNTA4QGdtYWlsLmNvbQ:MRbV4pRuSBmdNqHi9l4n6";
const DID_AUTH = "Basic " + Buffer.from(DID_API_KEY).toString('base64');

const postData = JSON.stringify({
  source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Andrzej_Person_Kancelaria_Senatu.jpg/250px-Andrzej_Person_Kancelaria_Senatu.jpg",
  script: {
    type: 'text',
    input: "안녕하세요",
    provider: {
      type: 'microsoft',
      voice_id: 'ko-KR-SunHiNeural'
    }
  },
  config: {
    fluent: true,
    pad_audio: 0.0
  }
});

const req = https.request('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': DID_AUTH,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.on('error', console.error);
req.write(postData);
req.end();
