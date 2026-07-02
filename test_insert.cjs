const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('.env', 'utf-8');
let url, key;
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);
supabase.from('surveys').insert([{ score: 5, feedback: 'test', norwood: 'test', has_hair_loss: true }])
  .then(res => console.log(JSON.stringify(res, null, 2)))
  .catch(err => console.error(err));
