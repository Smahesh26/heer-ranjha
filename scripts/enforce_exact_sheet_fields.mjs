import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const productsPath = path.resolve('components/shop/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

function loadSheet(file) {
  const wb = xlsx.readFile(file, { sheetRows: 100 });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const hIdx = rows.findIndex(r => r && (r[0] === 'S.NO' || r[0] === 'S.no' || r[0] === 'S.No'));
  if (hIdx === -1) return [];
  const headers = rows[hIdx].map(h => h ? h.toString().trim() : '');
  return rows.slice(hIdx + 1).filter(r => r && r[0] && !isNaN(parseInt(r[0]))).map(r => {
    const item = {};
    headers.forEach((h, i) => {
      if (h) item[h] = r[i];
    });
    return item;
  });
}

const asayaItems = loadSheet('Collection- Asaya Detailed Sheet.xlsx');
const nayiItems = loadSheet('NAYI LEHER Corrected sheet for WEBSITE.xlsx');

function mapSubCategoryToSetIncludes(subCat) {
  if (!subCat) return '1 Ensemble';
  const s = subCat.toLowerCase();
  if (s.includes('kurta')) return '1 Kurta';
  if (s.includes('waistcoat') || s.includes('jacket') || s.includes('nehru')) return '1 Waistcoat / Nehru Jacket';
  if (s.includes('bandhgala')) return '1 Bandhgala';
  if (s.includes('sherwani')) return '1 Sherwani Set';
  if (s.includes('lehenga')) return '3 Pc Lehenga Set (Lehenga, Blouse & Dupatta)';
  if (s.includes('skirt')) return '2 Pc Skirt Set';
  if (s.includes('co-ord') || s.includes('coord')) return '2 Pc Co-ord Set';
  if (s.includes('saree')) return 'Saree & Blouse Set';
  if (s.includes('suit')) return '3 Pc Suit Set';
  return `${subCat} Set`;
}

let nayiMatched = 0;
let asayaMatched = 0;

products.forEach((p, idx) => {
  // Always enforce Wash Care = Dry Clean Only
  p.washCare = "Dry Clean Only";

  // Try to match Nayi Leher sheet first
  const nayiMatch = nayiItems.find(item => {
    const sName = (item['Product Name'] || '').toString().trim().toLowerCase();
    const pName = (p.name || '').toString().trim().toLowerCase();
    return sName === pName || (sName.length > 5 && pName.includes(sName)) || (pName.length > 5 && sName.includes(pName));
  });

  if (nayiMatch) {
    nayiMatched++;
    p.styleCode = (nayiMatch['Style Code'] || '').toString().trim() || `NL-${String(nayiMatched).padStart(3, '0')}`;
    p.sku = p.styleCode;
    p.setIncludes = (nayiMatch['Set Includes'] || '').toString().trim() || mapSubCategoryToSetIncludes(p.subCategory);
    p.disclaimer = (nayiMatch['Disclaimer'] || '').toString().trim() || "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Product colours may vary slightly due to lighting and screen settings.";
    p.shippingDetails = (nayiMatch['Shipping Details'] || '').toString().trim() || "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks.";
  } else {
    // Try to match Asaya sheet
    const asayaMatch = asayaItems.find(item => {
      const sName = (item['Product Name'] || '').toString().trim().toLowerCase();
      const pName = (p.name || '').toString().trim().toLowerCase();
      return sName === pName || (sName.length > 5 && pName.includes(sName)) || (pName.length > 5 && sName.includes(pName));
    });

    if (asayaMatch) {
      asayaMatched++;
      const code = (asayaMatch['Style Code'] || '').toString().trim();
      p.styleCode = code || `ASY-${String(asayaMatched).padStart(3, '0')}`;
      p.sku = p.styleCode;
      p.setIncludes = (asayaMatch['Set Includes'] || '').toString().trim() || mapSubCategoryToSetIncludes(p.subCategory);
    } else {
      p.styleCode = p.styleCode || `SKU-${String(idx + 1).padStart(3, '0')}`;
      p.sku = p.styleCode;
      p.setIncludes = p.setIncludes || mapSubCategoryToSetIncludes(p.subCategory);
    }

    if (!p.disclaimer) {
      p.disclaimer = "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Product colours may vary slightly due to lighting and screen settings.";
    }
    if (!p.shippingDetails) {
      p.shippingDetails = "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks.";
    }
  }
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`Enforced exact sheet fields across ${products.length} products! (Nayi matched: ${nayiMatched}, Asaya matched: ${asayaMatched})`);
