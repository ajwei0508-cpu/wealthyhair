const dns = require('dns');

dns.lookup('google.com', (err, address) => {
  console.log('google.com:', err ? err.message : address);
});

dns.lookup('hgczvcrazgxutuukkbyc.supabase.co', (err, address) => {
  console.log('supabase.co:', err ? err.message : address);
});
