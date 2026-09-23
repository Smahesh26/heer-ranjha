import json

new_product = {
  "id": "indigo-blue-hand-embroidered-kurta-2",
  "name": "Indigo-Blue-Hand-Embroidered-Kurta",
  "slug": "indigo-blue-hand-embroidered-kurta-2",
  "sku": "HKM-305-BLUE",
  "styleCode": "HKM-305-BLUE",
  "collection": "NAYI LEHER",
  "category": "Men's Wear",
  "subCategory": "Kurta",
  "setIncludes": "1 Kurta",
  "fabric": "Matka Silk",
  "washCare": "Dry Clean Only",
  "description": "Make a bold statement in this indigo blue kurta. It features vibrant red floral hand embroidery designed in a unique 'dripping' pattern that starts from the yoke and continues onto the sleeves and lower body. This kurta is ideal for sangeets, mehendi functions, or festive parties where you want to stand out.",
  "price": 21900,
  "mrp": 21900,
  "disclaimer": "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  "shippingDetails": "Free shipping across India on all orders. Made-To-Order Timeline For Men's Kurta 3 Weeks.",
  "stock": "MTO",
  "active": True,
  "images": [
    "/images/products/IndigoBlueHandEmbroideredKurtaother1Nayileher.JPG",
    "/images/products/IndigoBlueHandEmbroideredKurtaother2Nayileher.JPG",
    "/images/products/IndigoBlueHandEmbroideredKurtaotherNayileher.JPG"
  ],
  "sizes": [
    "M",
    "L",
    "XL"
  ]
}

# 1. Update lib/data/products.json and components/shop/products.json
for fpath in ['lib/data/products.json', 'components/shop/products.json']:
    with open(fpath, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Remove if existing HKM-305-BLUE already present
    products = [p for p in products if p.get('sku') != 'HKM-305-BLUE']
    
    # Find insert index: right after HKM-304-PINK
    insert_idx = None
    for i, p in enumerate(products):
        if p.get('sku') == 'HKM-304-PINK':
            insert_idx = i + 1
            break
            
    if insert_idx is not None:
        products.insert(insert_idx, new_product)
    else:
        products.append(new_product)
        
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    print(f'Successfully updated {fpath} (total: {len(products)})')

# 2. Update scratch/parsed_sheets.json
with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

for item in sheets.get('nayi', []):
    if item.get('Style Code') == 'HKM-305-BLUE':
        item['Product Name'] = 'Indigo-Blue-Hand-Embroidered-Kurta'
        item['Product Highlights (Description)'] = new_product['description']

with open('scratch/parsed_sheets.json', 'w', encoding='utf-8') as f:
    json.dump(sheets, f, indent=2, ensure_ascii=False)
print('Successfully updated scratch/parsed_sheets.json')
