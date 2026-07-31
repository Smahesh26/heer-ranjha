import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  const workbook = xlsx.readFile('Website Portfolio Structure and Data (1).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'S.no') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("Could not find header row");
    return;
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  const products = [];
  const existingSlugs = new Set();

  for (const row of dataRows) {
    if (!row[0]) continue;

    const item = {};
    for (let i = 0; i < headers.length; i++) {
      item[headers[i]] = row[i] || '';
    }

    const name = item['Product Name']?.toString().trim();
    if (!name) continue;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    existingSlugs.add(slug);

    const categoryStr = item['Product Category']?.toString().trim().toLowerCase() || '';
    let category = 'Men';
    if (categoryStr.includes('women')) category = 'Women';

    const subCategory = item['Product Sub Category (if any)']?.toString().trim() || 'Uncategorized';
    const collection = item['D.No Bottom']?.toString().trim() || 'Nayi Leher';
    
    let fabric = 'Mixed';
    if (name.toLowerCase().includes('matka')) fabric = 'Matka Silk';
    else if (name.toLowerCase().includes('cotton')) fabric = 'Cotton';
    else if (name.toLowerCase().includes('dupion')) fabric = 'Dupion';
    else if (name.toLowerCase().includes('raw silk')) fabric = 'Raw Silk';
    else if (name.toLowerCase().includes('organza')) fabric = 'Organza';
    else if (name.toLowerCase().includes('tissue')) fabric = 'Tissue';

    const description = item['Product Highlights']?.toString().trim() || 'Beautiful handcrafted piece.';

    products.push({
      id: slug,
      slug,
      name,
      description,
      detail: description, // for UI compat
      category,
      subCategory,
      collection,
      fabric,
      price: 0,
      mrp: 0,
      stock: 10,
      images: [],
      sizeOptions: ["S", "M", "L", "XL"],
      sizeCharges: {},
      active: true,
      featured: false
    });
  }

  const outPath = path.join(process.cwd(), 'components', 'shop', 'products.json');
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2));
  console.log(`Exported ${products.length} products to ${outPath}`);
}

main().catch(console.error);
