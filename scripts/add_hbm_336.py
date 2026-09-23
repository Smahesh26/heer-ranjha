import json
import shutil
import os

# 1. Copy webp files to multi- alias
for i in range(1, 6):
    src = f"public/images/products/mutlti-coloured-hand-embroidered-bandhgala-{i}.webp"
    dst = f"public/images/products/multi-coloured-hand-embroidered-bandhgala-{i}.webp"
    if os.path.exists(src):
        shutil.copyfile(src, dst)
        print(f"Copied {src} -> {dst}")
    else:
        print(f"WARNING: {src} not found!")

# 2. Product definition
hbm_product = {
    "id": "mutlti-coloured-hand-embroidered-bandhgala",
    "name": "Mutlti Coloured Hand Embroidered Bandhgala",
    "slug": "mutlti-coloured-hand-embroidered-bandhgala",
    "sku": "HBM-336-BLUE",
    "styleCode": "HBM-336-BLUE",
    "collection": "NAYI LEHER",
    "category": "Men's Wear",
    "subCategory": "Bandhgala",
    "setIncludes": "1 Bandhgala",
    "fabric": "Matka Silk",
    "washCare": "Dry Clean Only",
    "description": "Made from fine matka silk, it is richly decorated with all over multicoloured floral thread embroidery in bright pinks, yellows, green, and reds. An exceptional choice for grand evening weddings and formal dinners.",
    "price": 85000,
    "mrp": 85000,
    "disclaimer": "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
    "shippingDetails": "Free shipping across India on all orders. Made-To-Order Timeline For Men's  Bandhgala: 3-4 Week",
    "stock": "MTO",
    "active": True,
    "images": [
        "/images/products/mutlti-coloured-hand-embroidered-bandhgala-1.webp",
        "/images/products/mutlti-coloured-hand-embroidered-bandhgala-2.webp",
        "/images/products/mutlti-coloured-hand-embroidered-bandhgala-3.webp",
        "/images/products/mutlti-coloured-hand-embroidered-bandhgala-4.webp",
        "/images/products/mutlti-coloured-hand-embroidered-bandhgala-5.webp"
    ],
    "sizes": [
        "M",
        "L",
        "XL"
    ]
}

# 3. Load products
with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Check if already exists
exists = any(p.get('sku') == 'HBM-336-BLUE' for p in products)
if exists:
    print("HBM-336-BLUE already exists in products.json! Updating it...")
    products = [hbm_product if p.get('sku') == 'HBM-336-BLUE' else p for p in products]
else:
    # Find insert index: before HSD-348-GREEN
    target_idx = -1
    for idx, p in enumerate(products):
        if p.get('sku') == 'HSD-348-GREEN':
            target_idx = idx
            break
    if target_idx != -1:
        products.insert(target_idx, hbm_product)
        print(f"Inserted HBM-336-BLUE at index {target_idx} (before HSD-348-GREEN)")
    else:
        products.append(hbm_product)
        print("Appended HBM-336-BLUE to products")

print(f"Total products now: {len(products)}")

# 4. Save to both files
with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Saved to lib/data/products.json and components/shop/products.json")
