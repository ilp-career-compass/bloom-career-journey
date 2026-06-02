import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('--- Environment Variables ---');
for (const key of Object.keys(process.env)) {
  if (key.includes('SUPABASE') || key.includes('KEY') || key.includes('SECRET') || key.includes('PORT') || key.includes('URL')) {
    const val = process.env[key];
    console.log(`${key}: ${val ? val.substring(0, 10) + '...' + val.substring(val.length - 5) : 'undefined'}`);
  }
}
