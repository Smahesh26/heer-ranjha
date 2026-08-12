import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import https from 'https';

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

function extractDriveId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 303) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(dest);
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', (err) => reject(err));
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download, status code: ${res.statusCode}`));
      }
    }).on('error', (err) => reject(err));
  });
}

const products = [];
const existingSlugs = new Set();
const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function processFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && (rows[i][0] === 'S.NO' || rows[i][0] === 'S.no' || rows[i][0] === 'S.No')) {
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
    item.images = [];
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) {
        if (headers[i].includes('Image URLs')) {
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
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    existingSlugs.add(slug);

    const category = item['Product Category']?.toString().trim() || 'Uncategorized';
    const subCategory = item['Product Sub Category']?.toString().trim() || 'Default';
    const collection = item['Collection']?.toString().trim() || 'Uncategorized';
    const fabric = item['Fabric']?.toString().trim() || 'Mixed';
    const description = item['Product Highlights (Description)']?.toString().trim() || '';
    
    const price = extractNumber(item['Price']);
    const mrp = extractNumber(item['MRP']);
    
    let downloadedImages = [];
    for (let imgIndex = 0; imgIndex < item.images.length; imgIndex++) {
      const url = item.images[imgIndex];
      const driveId = extractDriveId(url);
      if (driveId) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        const imgName = `${slug}-${imgIndex + 1}.jpg`;
        const destPath = path.join(imagesDir, imgName);
        try {
          console.log(`Downloading image ${imgIndex + 1} for ${name}...`);
          await downloadImage(downloadUrl, destPath);
          downloadedImages.push(`/images/products/${imgName}`);
        } catch (err) {
          console.error(`Failed to download image for ${name}:`, err.message);
        }
      }
    }

    products.push({
      id: slug,
      slug,
      name,
      description,
      detail: description,
      category,
      subCategory,
      collection,
      fabric,
      price,
      mrp,
      stock: 10,
      images: downloadedImages,
      sizeOptions: ["S", "M", "L", "XL"],
      sizeCharges: {},
      active: true,
      featured: false
    });
  }
}

async function main() {
  console.log("Emptying public/images/products...");
  const oldFiles = fs.readdirSync(imagesDir);
  for (const file of oldFiles) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      fs.unlinkSync(path.join(imagesDir, file));
    }
  }

  console.log("Importing Asaya Collection...");
  await processFile('Collection- Asaya Detailed Sheet.xlsx');
  
  console.log("Importing Nayi Leher Collection...");
  await processFile('NAYI LEHER WEBSITE.xlsx');
  
  const outPath = path.join(process.cwd(), 'components', 'shop', 'products.json');
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2));
  console.log(`Exported ${products.length} products to ${outPath}`);
  
  console.log("Import and download completed!");
}

main().catch(console.error);
