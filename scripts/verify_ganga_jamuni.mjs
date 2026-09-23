import fs from 'fs';

const shopData = fs.readFileSync('components/shop/shopData.js', 'utf8');
const footer = fs.readFileSync('components/Footer.jsx', 'utf8');
const collections = fs.readFileSync('components/Collections.jsx', 'utf8');
const searchModal = fs.readFileSync('components/SearchModal.jsx', 'utf8');
const newArrivals = fs.readFileSync('components/NewArrivals.jsx', 'utf8');

const p1 = JSON.parse(fs.readFileSync('components/shop/products.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('lib/data/products.json', 'utf8'));

console.log('✓ products.json files identical:', JSON.stringify(p1) === JSON.stringify(p2));
console.log('✓ Total products:', p1.length);

const prod = p1.find(p => p.sku === 'HKP-97-Green');
console.log('✓ Found product:', prod.name);
console.log('  - SKU:', prod.sku);
console.log('  - Collection:', prod.collection);
console.log('  - Fabric:', prod.fabric);
console.log('  - Price:', prod.price);
console.log('  - Stock:', prod.stock);
console.log('  - Sizes:', prod.sizes);

const allImagesExist = prod.images.every(img => fs.existsSync('public' + img));
console.log('✓ All product images exist on disk:', allImagesExist);

console.log('✓ shopData.js contains GANGA JAMUNI:', shopData.includes('GANGA JAMUNI'));
console.log('✓ Collections.jsx contains ganga-jamuni:', collections.includes('ganga-jamuni'));
console.log('✓ Footer.jsx contains Ganga Jamuni:', footer.includes('Ganga Jamuni'));
console.log('✓ SearchModal.jsx contains GANGA JAMUNI:', searchModal.includes('GANGA JAMUNI'));
console.log('✓ NewArrivals.jsx contains Ganga Jamuni:', newArrivals.includes('Ganga Jamuni'));
