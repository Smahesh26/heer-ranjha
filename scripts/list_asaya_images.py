import json

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

asaya_items = [p for p in products if p.get('collection') == 'ASAYA']
print(f"Total ASAYA items: {len(asaya_items)}")
for p in asaya_items:
    imgs = p.get('images', [])
    first_img = imgs[0] if imgs else 'NO IMAGE'
    print(f"{p['name']} | {p.get('category')} | {p.get('subCategory')} | {first_img}")
