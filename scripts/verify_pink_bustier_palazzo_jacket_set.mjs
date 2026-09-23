import fs from 'fs';

const p1 = JSON.parse(fs.readFileSync('components/shop/products.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('lib/data/products.json', 'utf8'));

console.log('✓ products.json files identical:', JSON.stringify(p1) === JSON.stringify(p2));
console.log('✓ Total products:', p1.length);

const prod = p1.find(p => p.sku === 'AI-390-Pink');
console.log('✓ Found product:', prod.name);
console.log('  - SKU:', prod.sku);
console.log('  - Slug:', prod.slug);
console.log('  - Collection:', prod.collection);
console.log('  - Category:', prod.category);
console.log('  - SubCategory:', prod.subCategory);
console.log('  - Price:', prod.price);
console.log('  - Color:', prod.color);
console.log('  - Craft:', prod.craft);
console.log('  - Fabric:', prod.fabric);
console.log('  - Set Includes:', prod.setIncludes);
console.log('  - No. of Components:', prod.noOfComponents);
console.log('  - Stock:', prod.stock);
console.log('  - Sizes:', prod.sizes);

const allImagesExist = prod.images.every(img => {
  const exists = fs.existsSync('public' + img);
  console.log('  - Image:', img, exists);
  return exists;
});
console.log('✓ All product images exist on disk:', allImagesExist);

const gangaProds = p1.filter(p => p.collection === 'GANGA JAMUNI');
console.log('✓ Total GANGA JAMUNI products now:', gangaProds.length);
gangaProds.forEach((p, idx) => console.log(`   ${idx + 1}.`, p.name, `(${p.sku}) - ₹${p.price} [${p.category}] [${p.subCategory}]`));
