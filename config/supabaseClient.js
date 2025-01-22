import { createClient } from '@supabase/supabase-js'

// Verifica que las variables de entorno estén definidas
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Supabase Key:', process.env.REACT_APP_ANON_KEY);

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_ANON_KEY

// Verifica que las variables de entorno se hayan asignado correctamente
console.log('Supabase URL (asignada):', supabaseUrl);
console.log('Supabase Key (asignada):', supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }
