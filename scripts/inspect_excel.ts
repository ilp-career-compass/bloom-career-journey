import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buf = readFileSync(resolve(__dirname, '..', 'Updated_Qns.xlsx'));
const wb = XLSX.read(buf);

for (const sheetName of wb.SheetNames) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SHEET: ${sheetName}`);
  console.log('='.repeat(80));
  
  const ws = wb.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Print first 50 rows to understand structure
  for (let i = 0; i < Math.min(data.length, 60); i++) {
    const row = data[i];
    const nonEmpty = row.filter((c: any) => c !== '' && c !== null && c !== undefined);
    if (nonEmpty.length > 0) {
      console.log(`  Row ${i + 1}: [${row.map((c: any) => {
        const s = String(c).substring(0, 60);
        return s.length < String(c).length ? s + '...' : s;
      }).join(' | ')}]`);
    } else {
      console.log(`  Row ${i + 1}: (empty)`);
    }
  }
  
  console.log(`  ... Total rows: ${data.length}`);
}
