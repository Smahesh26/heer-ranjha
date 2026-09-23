import fs from 'fs';

const newProduct = {
  id: "red-fuchsia-embroidered-tunic-set",
  name: "Red & Fuchsia Embroidered Tunic Set",
  slug: "red-fuchsia-embroidered-tunic-set",
  sku: "AI-302-Red",
  styleCode: "AI-302-Red",
  color: "Red",
  craft: "Hand Embroidery",
  embroidery: "Hand Embroidery",
  collection: "GANGA JAMUNI",
  category: "Women's Wear",
  subCategory: "Co-Ord Set",
  setIncludes: "1 Kurta, 1 Bottom",
  noOfComponents: 2,
  fabric: "Chanderi",
  washCare: "Dry Clean Only",
  description: "This striking two-piece set is a fusion of bold color and intricate craftsmanship. The deep crimson tunic features delicate floral patchwork around the mandarin collar and has a tassels detail. The matching crimson pants features a subtle fuchsia border, complementing this sophisticated, artisanal ensemble. Perfect for making a graceful statement at intimate gatherings or festive occasions.",
  price: 18900,
  mrp: 18900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Red & Fuchsia Embroidered Tunic Set.png"
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

  // Remove existing AI-302-Red if present
  const filtered = content.filter(item => item.sku !== 'AI-302-Red' && item.id !== 'red-fuchsia-embroidered-tunic-set');

  // Insert right after the last Ganga Jamuni product
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 10;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 11;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
