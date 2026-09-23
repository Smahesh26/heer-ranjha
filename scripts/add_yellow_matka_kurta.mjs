import fs from 'fs';

const newProduct = {
  id: "sunshine-yellow-embroidered-kurta",
  name: "Sunshine Yellow Embroidered Kurta",
  slug: "sunshine-yellow-embroidered-kurta",
  sku: "HKP-96-Yellow",
  styleCode: "HKP-96-Yellow",
  color: "Yellow",
  craft: "Machine Embroidery",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Kurta",
  setIncludes: "1 Kurta",
  fabric: "Chanderi",
  washCare: "Dry Clean Only",
  description: "Radiate sophistication in this luxurious sunshine yellow kurta, tailored from a rich chanderi silk. The kurta's impeccable drape is complemented by meticulous multicolored floral and bird embroidery that adorns the collar, placket and wraps around the entire hemline. This kurta is a masterpiece of traditional art and contemporary fashion, designed for the gentleman to wear at high-profile celebrations and receptions.",
  price: 16900,
  mrp: 16900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Kurta 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Matkasilkkurta1.jpg",
    "/images/collections/GangaJamuni/Matkasilkkurta2.jpg",
    "/images/collections/GangaJamuni/Matkasilkkurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HKP-96-Yellow' && item.id !== 'yellow-matka-silk-kurta' && item.id !== 'matka-silk-kurta');
  filtered.splice(3, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
