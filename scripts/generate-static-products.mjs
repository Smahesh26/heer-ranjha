import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function extractNumber(str) {
  if (!str) return 0;
  const num = parseInt(str.toString().replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

const allProducts = [];
const usedSlugs = new Set();

function importFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === 'S.NO') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error(`Could not find header row in ${filePath}`);
    return;
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  for (const row of dataRows) {
    if (!row[0] || isNaN(parseInt(row[0]))) continue;

    const item = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) {
        if (headers[i] === 'Image URLs (comma separated)') {
            if (!item.images) item.images = [];
            if (row[i]) {
              const urls = row[i].toString().split(',').map(s => s.trim()).filter(Boolean);
              item.images.push(...urls);
            }
        } else {
            item[headers[i].trim()] = row[i];
        }
      }
    }

    const name = item['Product Name']?.toString().trim();
    if (!name) continue;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    const category = item['Product Category']?.toString().trim() || 'Uncategorized';
    const subCategory = item['Product Sub Category']?.toString().trim() || 'Default';
    const collection = item['Collection']?.toString().trim() || 'Uncategorized';
    const fabric = item['Fabric']?.toString().trim() || 'Mixed';
    const description = item['Product Highlights (Description)']?.toString().trim() || '';
    
    const price = extractNumber(item['Price']);
    const mrp = extractNumber(item['MRP']);
    
    const product = {
      id: generateId(),
      slug,
      name,
      description,
      category,
      subCategory,
      collection,
      fabric,
      price,
      mrp: mrp || price,
      stock: 10,
      lowStockThreshold: 5,
      images: item.images && item.images.length > 0 ? JSON.stringify(item.images) : '[]',
      sizeOptions: JSON.stringify(["S", "M", "L", "XL"]),
      sizeCharges: '{}',
      clothCare: '',
      termsAndConditions: '',
      featured: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allProducts.push(product);
  }
}

console.log("Importing Asaya Collection...");
importFile('Collection- Asaya Detailed Sheet.xlsx');
  
console.log("Importing Nayi Leher Collection...");
importFile('NAYI LEHER WEBSITE.xlsx');

const outputDir = path.join(process.cwd(), 'lib', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'products.json');
fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));

console.log(`Successfully generated ${allProducts.length} products to ${outputPath}`);
