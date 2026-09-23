const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const EXCEL_FILE = 'Website Portfolio Structure and Data (1).xlsx';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'products');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const productsJsonPath = path.join(process.cwd(), 'components', 'shop', 'products.json');
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));

// The row offset mapping:
// In our export_json.mjs, headerIndex was found.
// S.no is row index 0 in sheet_to_json, which means row 1 in Excel.
// Wait, export_json slices after headerIndex.
// Let's just find the row number by matching the product name or assuming order.
// Actually, it's easier to map row index to product index if we know the header row.
// Let's assume data starts at row 2 in Excel (0-indexed row 1).

function main() {
  const zip = new AdmZip(EXCEL_FILE);
  
  // 1. Parse drawing rels
  let relsEntry = zip.getEntry('xl/drawings/_rels/drawing1.xml.rels');
  if (!relsEntry) {
    console.error("No drawing rels found");
    return;
  }
  const relsXml = relsEntry.getData().toString('utf-8');
  const relsMap = {};
  const relRegex = /Id="([^"]+)".*?Target="([^"]+)"/g;
  let m;
  while ((m = relRegex.exec(relsXml)) !== null) {
    relsMap[m[1]] = m[2]; // e.g. "../media/image1.jpeg"
  }

  // 2. Parse drawing xml
  let drawingEntry = zip.getEntry('xl/drawings/drawing1.xml');
  if (!drawingEntry) {
    console.error("No drawing xml found");
    return;
  }
  const drawingXml = drawingEntry.getData().toString('utf-8');
  
  const anchorRegex = /<xdr:(twoCellAnchor|oneCellAnchor)>([\s\S]*?)<\/xdr:\1>/g;
  const rowToTarget = {};
  
  while ((m = anchorRegex.exec(drawingXml)) !== null) {
    const chunk = m[2];
    const rowMatch = /<xdr:row>(\d+)<\/xdr:row>/.exec(chunk);
    const embedMatch = /r:embed="([^"]+)"/.exec(chunk);
    if (rowMatch && embedMatch) {
      const row = parseInt(rowMatch[1], 10);
      const rId = embedMatch[1];
      const target = relsMap[rId];
      if (target) {
        // target is like "../media/image1.jpeg"
        const cleanTarget = target.replace('../', 'xl/');
        rowToTarget[row] = cleanTarget;
      }
    }
  }

  console.log(`Found ${Object.keys(rowToTarget).length} images mapped to rows.`);

  // 3. Match rows to products. 
  // Wait, we need to know which row each product is on.
  // Let's re-read the excel using xlsx to get the exact row numbers.
  const xlsx = require('xlsx');
  const wb = xlsx.readFile(EXCEL_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, {header: 1, defval: null});
  
  let headerIndex = -1;
  for(let i=0; i<rows.length; i++) {
    if(rows[i] && rows[i][0] === 'S.no') {
      headerIndex = i;
      break;
    }
  }
  
  const headers = rows[headerIndex];
  
  // Create a mapping from product name to slug from products.json
  const nameToSlug = {};
  products.forEach(p => {
    nameToSlug[p.name] = p.slug;
  });

  let matchCount = 0;
  let updateCount = 0;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const rowData = rows[r];
    if (!rowData || !rowData[0]) continue;
    
    // find product name
    const nameIndex = headers.indexOf('Product Name');
    const name = rowData[nameIndex]?.toString().trim();
    if (!name) continue;

    const slug = nameToSlug[name];
    if (!slug) continue;

    const target = rowToTarget[r];
    if (target) {
      matchCount++;
      const imgEntry = zip.getEntry(target);
      if (imgEntry) {
        const ext = path.extname(target) || '.jpg';
        const newFileName = `${slug}${ext}`;
        const outPath = path.join(OUTPUT_DIR, newFileName);
        
        fs.writeFileSync(outPath, imgEntry.getData());
        
        // update product
        const prod = products.find(p => p.slug === slug);
        if (prod) {
          prod.images = [`/images/products/${newFileName}`];
          updateCount++;
        }
      } else {
        console.warn(`Image entry not found in zip: ${target}`);
      }
    }
  }
  
  fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2));
  console.log(`Matched ${matchCount} rows to images. Updated ${updateCount} products.`);
}

main();
