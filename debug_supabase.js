import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('surveys')
    .insert([
      {
        score: 5,
        feedback: 'test',
        norwood: 'test',
        has_hair_loss: true
      }
    ]);
  
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success:', data);
  }
}

testInsert();
