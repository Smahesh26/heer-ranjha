import fs from 'fs';

const newProduct = {
  id: "natural-color-linen-kurta",
  name: "Natural Color Linen Kurta",
  slug: "natural-color-linen-kurta",
  sku: "HKP-109-Natural",
  styleCode: "HKP-109-Natural",
  color: "Natural Ivory",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Kurta",
  setIncludes: "1 Kurta",
  fabric: "Linen",
  washCare: "Dry Clean Only",
  description: "Crafted in breathable linen, this kurta is adorned with intricate Gond-inspired embroidery, featuring colourful artisanal motifs that bring a contemporary touch to traditional craftsmanship.",
  price: 18900,
  mrp: 18900,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Kurta 3 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/Linenkurta1.jpg",
    "/images/collections/GangaJamuni/Linenkurta2.jpg",
    "/images/collections/GangaJamuni/Linenkurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HKP-109-Natural' && item.id !== 'natural-color-linen-kurta' && item.id !== 'linen-kurta');
  // Place right after the first Ganga Jamuni product at index 1
  filtered.splice(1, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
