import json

def fix_product_images(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    for p in products:
        if p.get('sku') == 'HKP-234-BLACK' or p.get('id') == 'black-hand-embroidered-kurta':
            p['images'] = [
                '/images/products/black-matka-silk-embroidered-kurta-1.webp',
                '/images/products/black-matka-silk-embroidered-kurta-2.webp',
                '/images/products/black-matka-silk-embroidered-kurta-3.webp'
            ]
            print(f"Fixed images for {p['sku']} ({p['name']}): {p['images']}")
            
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

fix_product_images('components/shop/products.json')
fix_product_images('lib/data/products.json')

print("Successfully updated both products.json files!")

