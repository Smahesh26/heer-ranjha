import fs from 'fs';

const newProduct = {
  id: "grey-matka-silk-hand-embroidered-waistcoat",
  name: "Grey Matka silk hand embroidered waistcoat",
  slug: "grey-matka-silk-hand-embroidered-waistcoat",
  sku: "HJP-108-Grey",
  styleCode: "HJP-108-Grey",
  collection: "GANGA JAMUNI",
  category: "Men's Wear",
  subCategory: "Waistcoat",
  setIncludes: "1 Waistcoat",
  fabric: "Matka Silk",
  washCare: "Dry Clean Only",
  description: "A refined Matka silk waistcoat adorned with Gond Art inspired embroidered motifs, bringing together traditional artistry and contemporary elegance.",
  price: 21500,
  mrp: 21500,
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline For Men's Waistcoat 3-4 Weeks.",
  stock: "MTO",
  active: true,
  images: [
    "/images/collections/GangaJamuni/OatBeigeWarliArtKurta1.jpg",
    "/images/collections/GangaJamuni/OatBeigeWarliArtKurta2.png",
    "/images/collections/GangaJamuni/OatBeigeWarliArtKurta3.jpg"
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
  const filtered = content.filter(item => item.sku !== 'HJP-108-Grey' && item.id !== 'grey-matka-silk-hand-embroidered-waistcoat');
  filtered.splice(5, 0, newProduct);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  console.log(`Updated ${p}, count: ${filtered.length}`);
}
