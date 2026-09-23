import fs from 'fs';

const newProduct = {
  id: "oat-beige-warli-art-kurta",
  name: "Oat Beige Warli Art Kurta",
  slug: "oat-beige-warli-art-kurta",
  sku: "HKP-107-Natural",
  styleCode: "HKP-107-Natural",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Kurta",
  setIncludes: "1 Kurta",
  fabric: "Linen",
  washCare: "Dry Clean Only",
  description: "Make a unique style statement with this oat beige linen kurta, celebrating traditional Indian folk art. This breathable textured kurta is embellished with scattered, finely embroidered Warli motifs, depicting stylized dancing figures and intricate tree patterns across the chest and lower half. A culturally rich piece, perfect for cultural festivals and art-inspired gatherings.",
  price: 16500,
  mrp: 16500,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Kurta 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/ChikankariKurta1.jpg",
    "/images/collections/GangaJamuni/ChikankariKurta2.jpg",
    "/images/collections/GangaJamuni/ChikankariKurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HKP-107-Natural' && item.id !== 'grey-matka-silk-hand-embroidered-waistcoat' && item.id !== 'chikankari-kurta');
  // Place at index 2 right with the other Ganga Jamuni pieces
  filtered.splice(2, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
