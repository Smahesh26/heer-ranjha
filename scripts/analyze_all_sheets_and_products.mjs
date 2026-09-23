import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const files = {
  asaya: 'new/Collection- Asaya Corrected Sheet.xlsx',
  nayi: 'new/NAYI LEHER Corrected sheet for WEBSITE (Autosaved).xlsx',
  roomani: 'new/Roomani collection detailed sheet (Autosaved).xlsx'
};

function parseSheet(filePath) {
  if (!fs.existsSync(filePath)) return [];
  console.log(`Loading ${filePath}...`);
  const wb = xlsx.readFile(filePath, { sheets: [0], cellStyles: false, cellFormulas: false, cellDates: false, cellHTML: false });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find header row (the row containing SKU or Product Name)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const rowStr = JSON.stringify(rawRows[i] || []);
    if (rowStr.toLowerCase().includes('sku') || rowStr.toLowerCase().includes('product name')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const headers = rawRows[headerIndex].map(h => String(h || '').trim());
  const products = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const item = {};
    headers.forEach((h, colIdx) => {
      if (h) {
        item[h] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
      }
    });
    if (Object.values(item).some(v => v !== '')) {
      products.push(item);
    }
  }
  return products;
}

const asaya = parseSheet(files.asaya);
const nayi = parseSheet(files.nayi);
const roomani = parseSheet(files.roomani);

console.log(`\nParsed Summary: Asaya=${asaya.length}, Nayi Leher=${nayi.length}, Roomani=${roomani.length}`);

// Load products.json
const productsJsonPath = 'lib/data/products.json';
let currentProducts = [];
if (fs.existsSync(productsJsonPath)) {
  currentProducts = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
}
console.log(`Current products.json count: ${currentProducts.length}`);

// Search for Yellow items
console.log('\n--- SEARCHING FOR YELLOW ITEMS IN SHEETS ---');
[...asaya.map(p => ({...p, _sheet: 'Asaya'})), ...nayi.map(p => ({...p, _sheet: 'Nayi Leher'})), ...roomani.map(p => ({...p, _sheet: 'Roomani'}))].forEach(p => {
  const name = p['Product Name'] || p['Product Name '] || p['SKU'] || '';
  const desc = p['Product Highlights (Description)'] || p['Description'] || '';
  const color = p['Color'] || p['Colour'] || '';
  const sku = p['SKU'] || p['Style Code'] || '';
  if (name.toLowerCase().includes('yellow') || desc.toLowerCase().includes('yellow') || color.toLowerCase().includes('yellow') || sku.toLowerCase().includes('yellow') || name.toLowerCase().includes('mustard') || desc.toLowerCase().includes('mustard')) {
    console.log(`[${p._sheet}] SKU: "${sku}", Name: "${name}", Set Includes: "${p['Set Includes'] || p['Set includes']}", Collection: "${p.Collection}"`);
  }
});

console.log('\n--- SEARCHING FOR YELLOW ITEMS IN PRODUCTS.JSON ---');
currentProducts.forEach(p => {
  const name = p.name || '';
  const desc = p.description || '';
  const color = p.color || '';
  const collection = p.collection || '';
  if (name.toLowerCase().includes('yellow') || desc.toLowerCase().includes('yellow') || color.toLowerCase().includes('yellow') || name.toLowerCase().includes('mustard') || desc.toLowerCase().includes('mustard')) {
    console.log(`[products.json] ID: ${p.id}, SKU: ${p.sku || p.styleCode}, Name: "${p.name}", Collection: "${collection}", Set Includes: "${p.setIncludes}"`);
  }
});

console.log('\n--- PRINTING ALL ASAYA SHEET ITEMS (SKU, Name, Collection, Set Includes) ---');
asaya.forEach((p, idx) => {
  console.log(`Asaya Row ${idx+1}: SKU="${p['SKU'] || p['COLLECTION 2nd']}", Name="${p['Product Name'] || p['Product Name ']}", SetIncludes="${p['Set Includes'] || p['Set includes']}", Collection="${p['Collection']}"`);
});

console.log('\n--- PRINTING ALL NAYI LEHER SHEET ITEMS (SKU, Name, Collection, Set Includes) ---');
nayi.forEach((p, idx) => {
  console.log(`Nayi Row ${idx+1}: SKU="${p['SKU'] || p['Style Code']}", Name="${p['Product Name'] || p['Product Name ']}", SetIncludes="${p['Set Includes'] || p['Set includes']}", Collection="${p['Collection']}"`);
});

console.log('\n--- PRINTING ALL ROOMANI SHEET ITEMS (SKU, Name, Collection, Set Includes) ---');
roomani.forEach((p, idx) => {
  console.log(`Roomani Row ${idx+1}: SKU="${p['SKU'] || p['Style Code']}", Name="${p['Product Name'] || p['Product Name ']}", SetIncludes="${p['Set Includes'] || p['Set includes']}", Collection="${p['Collection']}"`);
});

