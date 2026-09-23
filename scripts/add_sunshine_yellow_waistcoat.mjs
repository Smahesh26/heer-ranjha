import fs from 'fs';

const newProduct = {
  id: "sunshine-yellow-embroidered-kurta",
  name: "Sunshine Yellow Embroidered Kurta",
  slug: "sunshine-yellow-embroidered-kurta",
  sku: "HJP-92-Green",
  styleCode: "HJP-92-Green",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Waistcoat",
  setIncludes: "1 Waistcoat",
  fabric: "Raw Silk",
  washCare: "Dry Clean Only",
  description: "Crafted in lustrous raw silk, this refined waistcoat features delicate thread embroidery accented with subtle sequin embellishments along the collar and just below the pockets. The understated detailing adds a sophisticated touch to its contemporary silhouette.",
  price: 18900,
  mrp: 18900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Waistcoat 3-4 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/SunshineYellowEmbroideredKurta1.jpg",
    "/images/collections/GangaJamuni/SunshineYellowEmbroideredKurta2.jpg",
    "/images/collections/GangaJamuni/SunshineYellowEmbroideredKurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HJP-92-Green' && item.id !== 'sunshine-yellow-embroidered-kurta');
  filtered.splice(6, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
