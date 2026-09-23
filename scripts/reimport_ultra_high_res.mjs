import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

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

function downloadAndProcessImage(url, tempPath, finalWebpPath) {
  return new Promise((resolve, reject) => {
    const handleResponse = (res) => {
      if (res.statusCode === 302 || res.statusCode === 303) {
        https.get(res.headers.location, handleResponse).on('error', reject);
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(tempPath);
        res.pipe(file);
        file.on('finish', async () => {
          file.close();
          try {
            // Process with sharp for Ultra-High Quality WebP (95% quality, 2400px width)
            await sharp(tempPath)
              .resize({ width: 2400, withoutEnlargement: true })
              .webp({ quality: 95, effort: 4 })
              .toFile(finalWebpPath);
            
            if (fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      } else {
        reject(new Error(`Status code: ${res.statusCode}`));
      }
    };

    https.get(url, handleResponse).on('error', reject);
  });
}

const allProducts = [];

async function importFile(filePath) {
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

  const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

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
    while (allProducts.some(p => p.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = item['Product Category']?.toString().trim() || 'Uncategorized';
    const subCategory = item['Product Sub Category']?.toString().trim() || 'Default';
    const collection = item['Collection']?.toString().trim() || 'Uncategorized';
    const fabric = item['Fabric']?.toString().trim() || 'Mixed';
    const description = (item['Product Description'] || item['Product Highlights (Description)'] || '').toString().trim();
    
    const price = extractNumber(item['Price']);
    const mrp = extractNumber(item['MRP']);
    const stock = 10;
    
    let downloadedImages = [];
    for (let imgIndex = 0; imgIndex < item.images.length; imgIndex++) {
      const url = item.images[imgIndex];
      const driveId = extractDriveId(url);
      if (driveId) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        const tempName = `${slug}-${imgIndex + 1}_temp.jpg`;
        const webpName = `${slug}-${imgIndex + 1}.webp`;
        const tempPath = path.join(imagesDir, tempName);
        const webpPath = path.join(imagesDir, webpName);
        try {
          console.log(`Processing high-res image ${imgIndex + 1} for ${name}...`);
          await downloadAndProcessImage(downloadUrl, tempPath, webpPath);
          downloadedImages.push(`/images/products/${webpName}`);
        } catch (err) {
          console.error(`Failed to download/process image for ${name}:`, err.message);
        }
      }
    }

    const newProduct = {
      id: slug,
      slug: slug,
      name,
      description,
      detail: description,
      category,
      subCategory,
      collection,
      fabric,
      price,
      mrp,
      stock,
      images: downloadedImages,
      sizeOptions: ["S", "M", "L", "XL"],
      sizeCharges: {},
      active: true,
      featured: false
    };
    
    allProducts.push(newProduct);
    console.log(`Created product (Ultra HQ): ${name}`);
  }
}

async function main() {
  console.log("Re-importing Asaya Collection with Ultra-HQ (95% quality, 2400px resolution)...");
  await importFile('Collection- Asaya Detailed Sheet.xlsx');
  
  console.log("Re-importing Nayi Leher Collection with Ultra-HQ (95% quality, 2400px resolution)...");
  await importFile('NAYI LEHER Corrected sheet for WEBSITE.xlsx');
  
  const outFile = path.join(process.cwd(), 'components', 'shop', 'products.json');
  fs.writeFileSync(outFile, JSON.stringify(allProducts, null, 2));
  console.log(`Saved ${allProducts.length} ultra-HQ products to ${outFile}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
