import fs from 'fs';

const newProduct = {
  id: "ivory-gond-art-inspired-co-ord-set",
  name: "Ivory Gond Art Inspired Co-Ord Set",
  slug: "ivory-gond-art-inspired-co-ord-set",
  sku: "AI-358-Off-White",
  styleCode: "AI-358-Off-White",
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
  description: "An understated off-white co-ord set adorned with Gond-art inspired embroidery in contrasting tones, thoughtfully placed across the neckline, front and lower hem. The relaxed silhouette and loose fit palazzo creates an effortless, modern look. Ideal for day out, resort occasions.",
  price: 21250,
  mrp: 21250,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline for Women's Wear: 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Ivroy Gond Art inspired Co-Ord Set.png"
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

  // Remove existing AI-358-Off-White if present
  const filtered = content.filter(item => item.sku !== 'AI-358-Off-White' && item.id !== 'ivory-gond-art-inspired-co-ord-set' && item.id !== 'ivroy-gond-art-inspired-co-ord-set');

  // Insert right after the last Ganga Jamuni product
  const lastGangaIndex = filtered.findLastIndex ? filtered.findLastIndex(item => item.collection === 'GANGA JAMUNI') : 11;
  const insertIndex = lastGangaIndex >= 0 ? lastGangaIndex + 1 : 12;
  filtered.splice(insertIndex, 0, newProduct);

  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}, inserted at index ${insertIndex}`);
}
