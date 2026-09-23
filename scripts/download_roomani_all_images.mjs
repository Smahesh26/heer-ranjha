import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const excelPath = 'new/Roomani collection detailed sheet (Autosaved).xlsx';
const libProductsPath = 'lib/data/products.json';
const shopProductsPath = 'components/shop/products.json';

const wb = xlsx.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const products = JSON.parse(fs.readFileSync(libProductsPath, 'utf8'));
const roomaniProducts = products.filter(p => (p.collection || '').toLowerCase() === 'roomani');

console.log(`Found ${roomaniProducts.length} Roomani products in products.json`);

function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  return null;
}

function downloadFile(fileId, destPath) {
  const url1 = `https://lh3.googleusercontent.com/d/${fileId}`;
  try {
    execSync(`curl.exe -s -L "${url1}" -o "${destPath}"`, { timeout: 30000 });
    const stats = fs.statSync(destPath);
    if (stats.size > 2000) {
      return true;
    }
  } catch (err) {
    console.warn(`Primary download failed for ${fileId}:`, err.message);
  }

  // Fallback
  const url2 = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    execSync(`curl.exe -s -L "${url2}" -o "${destPath}"`, { timeout: 30000 });
    const stats = fs.statSync(destPath);
    if (stats.size > 2000) {
      return true;
    }
  } catch (err) {
    console.error(`Fallback download failed for ${fileId}:`, err.message);
  }
  return false;
}

let downloadedCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (let r = 2; r < rows.length; r++) {
  const row = rows[r];
  if (!row || !row[1]) continue;
  const sno = row[0];
  const sku = String(row[1]).trim();
  const name = String(row[2]).trim();
  const urls = row.slice(15).filter(u => typeof u === 'string' && u.includes('drive.google.com'));

  // Find product by S.NO index (sno - 1) or SKU
  const product = roomaniProducts[sno - 1];
  if (!product) {
    console.error(`No product found for Row ${sno} (${sku}: ${name})`);
    continue;
  }

  console.log(`\nProcessing [${sno}/35] ${product.name} (${product.slug}) - ${urls.length} URLs in sheet`);

  const updatedImages = [];

  for (let i = 0; i < urls.length; i++) {
    const imgUrl = urls[i];
    const fileId = extractDriveId(imgUrl);
    const imgFilename = `${product.slug}-${i + 1}.jpg`;
    const relPath = `/images/products/${imgFilename}`;
    const absPath = path.resolve('public/images/products', imgFilename);

    if (i === 0 && fs.existsSync(absPath)) {
      const stats = fs.statSync(absPath);
      if (stats.size > 2000) {
        // Image 1 already exists
        updatedImages.push(relPath);
        skippedCount++;
        continue;
      }
    }

    if (fs.existsSync(absPath)) {
      const stats = fs.statSync(absPath);
      if (stats.size > 2000) {
        console.log(`  Image ${i + 1} exists (${Math.round(stats.size / 1024)} KB), reusing.`);
        updatedImages.push(relPath);
        skippedCount++;
        continue;
      }
    }

    if (!fileId) {
      console.error(`  Could not extract Drive ID for image ${i + 1}: ${imgUrl}`);
      failedCount++;
      continue;
    }

    console.log(`  Downloading image ${i + 1}/${urls.length}: ID ${fileId} -> ${imgFilename}...`);
    const success = downloadFile(fileId, absPath);
    if (success) {
      const stats = fs.statSync(absPath);
      console.log(`  ✓ Successfully downloaded image ${i + 1} (${Math.round(stats.size / 1024)} KB)`);
      updatedImages.push(relPath);
      downloadedCount++;
    } else {
      console.error(`  ✗ Failed to download image ${i + 1}`);
      failedCount++;
    }
  }

  if (updatedImages.length > 0) {
    product.images = updatedImages;
    product.image = updatedImages[0];
    // Also update in main products array
    const mainIdx = products.findIndex(p => p.id === product.id);
    if (mainIdx !== -1) {
      products[mainIdx].images = updatedImages;
      products[mainIdx].image = updatedImages[0];
    }
  }
}

console.log(`\n================================`);
console.log(`Download Summary:`);
console.log(`Downloaded: ${downloadedCount}`);
console.log(`Skipped (already exists): ${skippedCount}`);
console.log(`Failed: ${failedCount}`);
console.log(`================================\n`);

// Save to both files
fs.writeFileSync(libProductsPath, JSON.stringify(products, null, 2), 'utf8');
fs.writeFileSync(shopProductsPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`Successfully updated ${libProductsPath} and ${shopProductsPath}!`);
