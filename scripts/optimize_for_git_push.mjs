import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const productsDir = path.resolve('public/images/products');
const productsJsonPath = path.resolve('components/shop/products.json');
const collectionsPath = path.resolve('components/Collections.jsx');

async function main() {
  console.log('Cleaning up duplicate files and optimizing images for Git & Vercel deployment...');

  if (!fs.existsSync(productsDir)) {
    console.error('Products directory not found');
    return;
  }

  const files = fs.readdirSync(productsDir);
  let convertedCount = 0;
  let deletedJpgs = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const fullPath = path.join(productsDir, file);
    const baseName = path.basename(file, ext);
    const webpPath = path.join(productsDir, `${baseName}.webp`);

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        await sharp(fullPath)
          .resize({ width: 1800, withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(webpPath);

        fs.unlinkSync(fullPath);
        convertedCount++;
      } catch (err) {
        console.error(`Failed to process ${file}:`, err.message);
      }
    }
  }

  // Update products.json references
  if (fs.existsSync(productsJsonPath)) {
    let content = fs.readFileSync(productsJsonPath, 'utf8');
    content = content.replace(/\.(jpg|jpeg|png)/gi, '.webp');
    fs.writeFileSync(productsJsonPath, content, 'utf8');
    console.log('Updated components/shop/products.json to .webp');
  }

  // Update Collections.jsx references
  if (fs.existsSync(collectionsPath)) {
    let content = fs.readFileSync(collectionsPath, 'utf8');
    content = content.replace(/\.(jpg|jpeg|png)/gi, '.webp');
    fs.writeFileSync(collectionsPath, content, 'utf8');
    console.log('Updated components/Collections.jsx to .webp');
  }

  // Measure final folder size
  const finalFiles = fs.readdirSync(productsDir);
  let totalBytes = 0;
  finalFiles.forEach(f => {
    totalBytes += fs.statSync(path.join(productsDir, f)).size;
  });

  console.log(`\nOptimization Complete!`);
  console.log(`Converted/Cleaned ${convertedCount} images.`);
  console.log(`Total final folder size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB (Ready for Git Push & Live Deploy!)`);
}

main().catch(console.error);
