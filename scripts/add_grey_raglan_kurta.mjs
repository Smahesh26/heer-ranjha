import fs from 'fs';

const newProduct = {
  id: "grey-raglan-sleeve-solid-kurta",
  name: "Yellow Hand Embroidered Waistcoat",
  slug: "grey-raglan-sleeve-solid-kurta",
  sku: "HJP-91",
  styleCode: "HJP-91",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Waistcoat",
  setIncludes: "1 Waistcoat",
  fabric: "Raw Silk",
  washCare: "Dry Clean Only",
  description: "Exude timeless elegance in this vibrant mustard Nehru-Jacket, intricately adorned with fine embroideries multi-colored floral motifs. This artisanal masterpiece brings rich texture to ethnic wear. An ideal choice for weddings, festive receptions, and grand celebrations.",
  price: 28500,
  mrp: 28500,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Waistcoat 3-4 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/GreyRaglanSleeveSolidKurta1.jpg",
    "/images/collections/GangaJamuni/GreyRaglanSleeveSolidKurta2.jpg",
    "/images/collections/GangaJamuni/GreyRaglanSleeveSolidKurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HJP-91' && item.id !== 'grey-raglan-sleeve-solid-kurta');
  filtered.splice(4, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
