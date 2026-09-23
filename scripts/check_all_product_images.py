import json
import os

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Checking images for all {len(products)} products...")

missing_products = []

for p in products:
    imgs = p.get('images', [])
    valid_imgs = []
    missing_imgs = []
    
    for img in imgs:
        # strip leading slash
        rel_path = img.lstrip('/')
        full_path = os.path.join(process_cwd := os.getcwd(), 'public', rel_path)
        if os.path.exists(full_path):
            valid_imgs.append(img)
        else:
            missing_imgs.append(img)
            
    if missing_imgs or not valid_imgs:
        missing_products.append({
            'id': p.get('id'),
            'name': p.get('name'),
            'sku': p.get('sku'),
            'slug': p.get('slug'),
            'images': imgs,
            'missing': missing_imgs,
            'valid': valid_imgs
        })

print(f"\nTotal products with missing/broken images: {len(missing_products)} / {len(products)}")
print("\nFirst 20 products with missing images:")
for m in missing_products[:20]:
    print(f"- [{m['sku']}] {m['name']} (ID: {m['id']})")
    print(f"  Given images: {m['images']}")
    print(f"  Missing: {m['missing']}")
    print(f"  Valid: {m['valid']}")

