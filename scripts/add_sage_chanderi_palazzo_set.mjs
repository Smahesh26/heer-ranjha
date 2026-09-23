import fs from 'fs';

const newProduct = {
  id: "sage-chanderi-bustier-palazzo-with-organza-shrug",
  name: "Sage Chanderi Bustier & Palazzo with Organza Shrug",
  slug: "sage-chanderi-bustier-palazzo-with-organza-shrug",
  sku: "AS-316-Green",
  styleCode: "AS-316-Green",
  color: "Green",
  craft: "Hand & Machine Embroidery",
  embroidery: "Hand & Machine Embroidery",
  collection: "GANGA JAMUNI",
  category: "Women's Wear",
  subCategory: "Palazzo Sets",
  setIncludes: "1 Shrug, 1 Bustier, 1 Flared Palazzo",
  noOfComponents: 3,
  fabric: "Chanderi & Organza",
  washCare: "Dry Clean Only",
  description: "Elevate your festive and celebratory wardrobe with this ethereal sage green ensemble. Crafted from Luxurious lightweight chanderi, the inner bustier and coordinated palazzo features delicate tonal motifs and fine craftsmanship. Layered over it is a stunning sheer organza shrug, artfully adorned with intricate floral embroidery, vine trails, and statement border detailing. Designed for the modern tastemaker who values refined grace and effortless movement.",
  price: 26900,
  mrp: 26900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3-4 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Sage Chanderi Bustier & Palazzo with Organza Shrug.png"
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

  // Also clean up HJP-92-Green trailing space if present
  const hjp92 = content.find(item => item.sku === 'HJP-92-Green');
  if (hjp92) {
    hjp92.id = 'sage-green-raw-silk-hand-embroidered-waistcoat';
    hjp92.name = 'Sage Green Raw Silk Hand-Embroidered Waistcoat';
    hjp92.slug = 'sage-green-raw-silk-hand-embroidered-waistcoat';
  }

  // Remove existing AS-316-Green if already added
  const filtered = content.filter(item => item.sku !== 'AS-316-Green' && item.id !== 'sage-chanderi-bustier-palazzo-with-organza-shrug');

  // Insert after the last Ganga Jamuni product (after HJP-92-Green)
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 6;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 7;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
