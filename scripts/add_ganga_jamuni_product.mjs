import fs from 'fs';

const newProduct = {
  id: "pista-green-floral-embroidered-kurta",
  name: "Pista Green Floral Embroidered Kurta",
  slug: "pista-green-floral-embroidered-kurta",
  sku: "HKP-97-Green",
  styleCode: "HKP-97-Green",
  color: "Green",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Kurta",
  setIncludes: "1 Kurta",
  fabric: "Chanderi",
  washCare: "Dry Clean Only",
  description: "Crafted in refined Chanderi, this kurta features intricate floral embroidery combining machine and handwork. Delicate multicoloured motifs are thoughtfully placed across the kurta front and sleeves, complemented by a refined band collar and buttoned placket.",
  price: 19500,
  mrp: 19500,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Kurta 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/PistaGreenFloraEmbroideredKurta1.jpg",
    "/images/collections/GangaJamuni/PistaGreenFloraEmbroideredKurta2.jpg",
    "/images/collections/GangaJamuni/PistaGreenFloraEmbroideredKurta3.jpg"
  ],
  sizes: [
    "M",
    "L",
    "XL"
  ]
};

const paths = ['components/shop/products.json', 'lib/data/products.json'];

for (const p of paths) {
  const content = JSON.parse(fs.readFileSync(p, 'utf8'));
  const filtered = content.filter(item => item.sku !== 'HKP-97-Green' && item.id !== 'pista-green-floral-embroidered-kurta');
  filtered.unshift(newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
