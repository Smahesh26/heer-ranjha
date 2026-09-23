import json
import re

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Auditing category vs image alignment across {len(products)} products...\n")

mismatches = []

for p in products:
    cat = p.get('category', '')
    imgs = p.get('images', [])
    
    # Check if Men's product has women/skirt/sharara/lehenga in image filename
    if "men" in cat.lower() and "women" not in cat.lower():
        for img in imgs:
            img_lower = img.lower()
            if any(w in img_lower for w in ['sharara', 'lehenga', 'saree', 'skirt', 'bustier', 'contemporary-hand-embroidered-kurta-set']):
                mismatches.append((p['sku'], p['name'], cat, img, "Men product given Women image"))

    # Check if Women product has mens/sherwani/bandhgala/nehru in image filename
    if "women" in cat.lower():
        for img in imgs:
            img_lower = img.lower()
            if any(w in img_lower for w in ['sherwani', 'nehru-jacket', 'bandhgala']):
                mismatches.append((p['sku'], p['name'], cat, img, "Women product given Men image"))

print(f"Found {len(mismatches)} category-image alignment mismatches:")
for m in mismatches:
    print(f"- [{m[0]}] '{m[1]}' ({m[2]}): {m[3]} -> Issue: {m[4]}")

