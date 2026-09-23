import xlsx from 'xlsx';
import fs from 'fs';

const wb = xlsx.readFile('new/Roomani collection detailed sheet (Autosaved).xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const products = JSON.parse(fs.readFileSync('lib/data/products.json', 'utf8'));
const roomaniProducts = products.filter(p => (p.collection || '').toLowerCase() === 'roomani');

console.log('Total Roomani in json:', roomaniProducts.length);
console.log('Total rows in sheet:', data.length);

let totalUrls = 0;
let matchCount = 0;

console.log("\n--- JSON Roomani Products ---");
roomaniProducts.forEach((p, idx) => {
  console.log(`JSON [${idx+1}] SKU: ${p.sku} | Name: ${p.name} | Slug: ${p.slug} | Images: ${JSON.stringify(p.images)}`);
});

console.log("\n--- Sheet Rows ---");
for (let r = 2; r < data.length; r++) {
  const row = data[r];
  if (!row || !row[1]) continue;
  const sno = row[0];
  const sku = String(row[1]).trim();
  const name = String(row[2]).trim();
  const urls = row.slice(15).filter(u => typeof u === 'string' && u.includes('drive.google.com'));
  const p = roomaniProducts[sno - 1];
  console.log(`Sheet [${sno}] SKU: ${sku} | Name: ${name} | URLs: ${urls.length} <=> JSON SKU: ${p?.sku} | JSON Slug: ${p?.slug}`);
}

