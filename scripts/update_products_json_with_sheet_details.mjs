import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const productsPath = path.resolve('components/shop/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

function readSheetData(filePath) {
  const wb = xlsx.readFile(filePath, { sheetRows: 70 });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const hIdx = rows.findIndex(r => r && (r[0] === 'S.NO' || r[0] === 'S.no' || r[0] === 'S.No'));
  if (hIdx === -1) return [];

  const headers = rows[hIdx].map(h => h ? h.toString().trim() : '');
  const dataRows = rows.slice(hIdx + 1);

  return dataRows.filter(r => r && r[0] && !isNaN(parseInt(r[0]))).map(r => {
    const item = {};
    headers.forEach((h, i) => {
      if (h) item[h] = r[i];
    });
    return item;
  });
}

const asayaItems = readSheetData('Collection- Asaya Detailed Sheet.xlsx');
const nayiItems = readSheetData('NAYI LEHER Corrected sheet for WEBSITE.xlsx');

const allItems = [...asayaItems, ...nayiItems];

const defaultShipping = "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks.";
const defaultDisclaimer = "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Product colours may vary slightly due to lighting and screen settings.";
const defaultWashCare = "Dry Clean Only";

let updatedCount = 0;

products.forEach(p => {
  const match = allItems.find(item => {
    const sheetName = (item['Product Name'] || '').toString().trim().toLowerCase();
    const prodName = (p.name || '').toString().trim().toLowerCase();
    return sheetName === prodName || sheetName.includes(prodName) || prodName.includes(sheetName);
  });

  if (match) {
    p.styleCode = match['Style Code']?.toString().trim() || p.id.toUpperCase();
    p.setIncludes = match['Set Includes']?.toString().trim() || "Ensemble";
    p.washCare = match['Wash Care']?.toString().trim() || defaultWashCare;
    p.disclaimer = match['Disclaimer']?.toString().trim() || defaultDisclaimer;
    p.shippingDetails = match['Shipping Details']?.toString().trim() || defaultShipping;
  } else {
    p.styleCode = p.id.toUpperCase();
    p.setIncludes = "Ensemble";
    p.washCare = defaultWashCare;
    p.disclaimer = defaultDisclaimer;
    p.shippingDetails = defaultShipping;
  }

  updatedCount++;
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`Successfully updated ${updatedCount} products in products.json with Shipping Details, Disclaimer, Wash Care & Set Includes!`);
