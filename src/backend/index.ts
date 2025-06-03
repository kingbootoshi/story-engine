import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST, before any other imports
dotenv.config({ path: join(__dirname, '../../.env') });

// Debug: Log environment variable loading
console.log('🔧 Loading Environment Variables...');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('- OPENPIPE_API_KEY:', process.env.OPENPIPE_API_KEY ? '✅ Loaded' : '❌ Missing');

// Check required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase environment variables!');
  console.error('Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Missing OPENROUTER_API_KEY!');
  console.error('Please check your .env file and ensure OPENROUTER_API_KEY is set.');
  process.exit(1);
}

// Now import and start the server after env vars are loaded
import('./api/server.ts').then(() => {
  console.log('✅ Server module loaded successfully');
}).catch(err => {
  console.error('❌ Failed to load server:', err);
  process.exit(1);
});