import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const productsDir = path.resolve('public/images/products');
const productsJsonPath = path.resolve('components/shop/products.json');
const collectionsPath = path.resolve('components/Collections.jsx');

async function convertDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  let convertedCount = 0;
  let savedBytes = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const fullPath = path.join(dirPath, file);
      const baseName = path.basename(file, ext);
      const webpPath = path.join(dirPath, `${baseName}.webp`);

      try {
        const stats = fs.statSync(fullPath);
        const originalSize = stats.size;

        await sharp(fullPath)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(webpPath);

        const newStats = fs.statSync(webpPath);
        savedBytes += (originalSize - newStats.size);
        convertedCount++;

        // Remove original file
        fs.unlinkSync(fullPath);
        console.log(`Converted: ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB) -> ${baseName}.webp (${(newStats.size / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err.message);
      }
    }
  }

  console.log(`\nFinished converting ${convertedCount} images.`);
  console.log(`Total space saved: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
}

async function updateProductsJson() {
  if (!fs.existsSync(productsJsonPath)) return;
  let content = fs.readFileSync(productsJsonPath, 'utf8');
  content = content.replace(/\.(jpg|jpeg|png)/gi, '.webp');
  fs.writeFileSync(productsJsonPath, content, 'utf8');
  console.log('Updated components/shop/products.json references to .webp');
}

async function updateCollectionsJsx() {
  if (!fs.existsSync(collectionsPath)) return;
  let content = fs.readFileSync(collectionsPath, 'utf8');
  content = content.replace(/\.(jpg|jpeg|png)/gi, '.webp');
  fs.writeFileSync(collectionsPath, content, 'utf8');
  console.log('Updated components/Collections.jsx references to .webp');
}

async function main() {
  console.log('Starting image conversion to WebP...');
  await convertDirectory(productsDir);
  await updateProductsJson();
  await updateCollectionsJsx();
  console.log('All image optimization complete!');
}

main().catch(console.error);
