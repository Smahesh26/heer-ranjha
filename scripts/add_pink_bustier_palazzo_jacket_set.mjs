import fs from 'fs';

const newProduct = {
  id: "pink-bustier-palazzo-with-sheer-high-low-length-jacket",
  name: "Pink Bustier & Palazzo With Sheer High-low Length Jacket",
  slug: "pink-bustier-palazzo-with-sheer-high-low-length-jacket",
  sku: "AI-390-Pink",
  styleCode: "AI-390-Pink",
  color: "Pink",
  craft: "Hand Embroidery",
  embroidery: "Hand Embroidery",
  collection: "GANGA JAMUNI",
  category: "Women's Wear",
  subCategory: "Jacket Set",
  setIncludes: "1 Sheer Jacket, 1 Bustier, 1 Palazzo",
  noOfComponents: 3,
  fabric: "Organza Jacket & Chanderi Top-Bottom",
  washCare: "Dry Clean Only",
  description: "Make an ethereal statement in this three-piece set, featuring a sheer flowing long organza fabric jacket, a bustier and a matching wide-leg palazzo. Accented with subtle botanical motifs and sheer finishes from the Ganga-Jamuni collection, this ensemble delivers high-fashion luxury. Ideal for grand festivities, destination weddings, and upscale evening receptions.",
  price: 27900,
  mrp: 27900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Pink Bustier & Palazzo With Sheer High-low Length Jacket.png"
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

  // Remove existing AI-390-Pink if present
  const filtered = content.filter(item => item.sku !== 'AI-390-Pink' && item.id !== 'pink-bustier-palazzo-with-sheer-high-low-length-jacket');

  // Insert right after the last Ganga Jamuni product
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 8;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 9;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
