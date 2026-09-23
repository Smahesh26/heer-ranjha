import fs from 'fs';

const newProduct = {
  id: "off-white-warli-art-co-ord-set",
  name: "Off-White Warli Art Co-Ord Set",
  slug: "off-white-warli-art-co-ord-set",
  sku: "AI-359-Off-White",
  styleCode: "AI-359-Off-White",
  color: "Off-White",
  craft: "Hand & Machine Embroidery",
  embroidery: "Hand & Machine Embroidery",
  collection: "GANGA JAMUNI",
  category: "Women's Wear",
  subCategory: "Co-Ord Set",
  setIncludes: "1 Kurta, 1 Bottom",
  noOfComponents: 2,
  fabric: "Linen",
  washCare: "Dry Clean Only",
  description: "This linen kurta featuring a clean button-front silhouette and scattered folk-inspired motifs, paired with matching relaxed bottom. Minimal yet distinctive, the design brings artisanal character to everyday dressings. Perfect for daywear, intimate gatherings and contemporary festive styling.",
  price: 22500,
  mrp: 22500,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Off-White Warli Art Co-Ord Set.png"
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

  // Remove existing AI-359-Off-White if already present
  const filtered = content.filter(item => item.sku !== 'AI-359-Off-White' && item.id !== 'off-white-warli-art-co-ord-set');

  // Insert right after the last Ganga Jamuni product
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 7;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 8;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
