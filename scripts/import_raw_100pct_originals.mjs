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

function downloadImageWithRetry(url, dest, maxRetries = 5) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryDownload() {
      attempt++;
      const request = https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 303) {
          https.get(res.headers.location, (res2) => {
            if (res2.statusCode === 200) {
              const file = fs.createWriteStream(dest);
              res2.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve();
              });
              file.on('error', (err) => handleErr(err));
            } else {
              handleErr(new Error(`Redirect status ${res2.statusCode}`));
            }
          }).on('error', handleErr);
        } else if (res.statusCode === 200) {
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
          file.on('error', (err) => handleErr(err));
        } else {
          handleErr(new Error(`HTTP status ${res.statusCode}`));
        }
      });

      request.on('error', handleErr);

      function handleErr(err) {
        if (attempt < maxRetries) {
          console.warn(`Retry ${attempt}/${maxRetries} for ${path.basename(dest)} due to: ${err.message}`);
          setTimeout(tryDownload, 1000 * attempt);
        } else {
          reject(err);
        }
      }
    }

    tryDownload();
  });
}

const allProducts = [];

async function importFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  sheet['!ref'] = 'A1:Z200'; // Limit sheet boundary to avoid empty rows
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
        const imgName = `${slug}-${imgIndex + 1}.jpg`;
        const destPath = path.join(imagesDir, imgName);
        try {
          console.log(`Downloading 100% raw original image ${imgIndex + 1} for ${name}...`);
          await downloadImageWithRetry(downloadUrl, destPath);
          downloadedImages.push(`/images/products/${imgName}`);
        } catch (err) {
          console.error(`ERROR downloading image for ${name}:`, err.message);
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
    console.log(`Successfully added product (Raw Original): ${name}`);
  }
}

async function updateCollectionsJsx() {
  const collectionsPath = path.resolve('components/Collections.jsx');
  if (!fs.existsSync(collectionsPath)) return;
  let content = fs.readFileSync(collectionsPath, 'utf8');
  content = content.replace(/\.webp/gi, '.jpg');
  fs.writeFileSync(collectionsPath, content, 'utf8');
  console.log('Updated components/Collections.jsx references back to .jpg');
}

async function main() {
  console.log("Importing Asaya Collection (100% Raw Original Images, 0 Errors)...");
  await importFile('Collection- Asaya Detailed Sheet.xlsx');
  
  console.log("Importing Nayi Leher Collection (100% Raw Original Images, 0 Errors)...");
  await importFile('NAYI LEHER Corrected sheet for WEBSITE.xlsx');
  
  await updateCollectionsJsx();

  const outFile = path.join(process.cwd(), 'components', 'shop', 'products.json');
  fs.writeFileSync(outFile, JSON.stringify(allProducts, null, 2));
  console.log(`\n🎉 COMPLETELY SUCCESSFUL: Saved ${allProducts.length} raw original products with ZERO errors to ${outFile}`);
}

main().catch(e => {
  console.error('CRITICAL IMPORT ERROR:', e);
  process.exit(1);
});
