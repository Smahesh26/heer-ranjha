import fs from 'fs';

const newProduct = {
  id: "lime-yellow-sharara-set",
  name: "Lime Yellow Sharara Set",
  slug: "lime-yellow-sharara-set",
  sku: "AS-323-Yellow",
  styleCode: "AS-323-Yellow",
  color: "Yellow",
  craft: "Hand & Machine Embroidery",
  embroidery: "Hand & Machine Embroidery",
  collection: "GANGA JAMUNI",
  category: "Women's Wear",
  subCategory: "Suit Set",
  setIncludes: "1 Kurta, 1 Bottom, 1 Dupatta",
  noOfComponents: 3,
  fabric: "Chanderi: Kurta-Bottom, Organza- Dupatta",
  washCare: "Dry Clean Only",
  description: "A fresh yellow ensemble featuring a yellow embroidered kurta with delicate floral and vine-inspired detailing, paired with a fluid, gathered sharara and sheer organza fabric dupatta, scalloped edges and a small tassels accents complete the look. Ideal for the day festivities, mehendi celebrations, summer occasions and destination events.",
  price: 33900,
  mrp: 33900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Lime Yellow Sharara Set.png"
  ],
  sizes: [
    "S",
    "M",
    "L",
    "XL"
  ]
};

const paths = ['components/shop/products.json', 'lib/data/products.json'];

for (const p of paths) {
  const content = JSON.parse(fs.readFileSync(p, 'utf8'));

  // Remove existing AS-323-Yellow if present
  const filtered = content.filter(item => item.sku !== 'AS-323-Yellow' && item.id !== 'lime-yellow-sharara-set');

  // Insert right after the last Ganga Jamuni product
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 9;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 10;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
