import json
import os

with open('lib/data/products.json', encoding='utf-8') as f:
    products = json.load(f)

roomani = [p for p in products if (p.get('collection') or '').lower() == 'roomani']
print('Roomani count:', len(roomani))

total_images = 0
all_exist = True
missing_files = []

for idx, p in enumerate(roomani):
    imgs = p.get('images', [])
    total_images += len(imgs)
    for img in imgs:
        local_path = os.path.join('public', img.lstrip('/\\'))
        if not os.path.exists(local_path) or os.path.getsize(local_path) < 2000:
            all_exist = False
            missing_files.append((p['name'], img, local_path))
    print(f"{idx+1:2d}. [{p['sku']}] {p['name']} -> {len(imgs)} images: {imgs}")

print(f"\nTotal images across Roomani collection: {total_images}")
print(f"All image files exist and valid (>2KB): {all_exist}")
if missing_files:
    print(f"Missing / invalid files ({len(missing_files)}):", missing_files)
