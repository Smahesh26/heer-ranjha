import json
import os
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

img_dir = 'public/images/products'
files = os.listdir(img_dir) if os.path.exists(img_dir) else []
print(f"Total image files in public/images/products: {len(files)}")

# Check Google Drive links in sheets
drive_links_count = 0
for sheet_key, items in sheets.items():
    for item in items:
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        imgs_str = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        if imgs_str:
            drive_links_count += 1

print(f"Products with Drive URLs in sheet: {drive_links_count} / {sum(len(v) for v in sheets.values())}")

# Try matching products to existing filenames
print("\n--- Testing matching techniques against 414 image files ---")

def clean(s):
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

all_items = []
for sheet_key, items in sheets.items():
    for item in items:
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        imgs_str = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        all_items.append({
            'sheet_key': sheet_key,
            'sku': sku,
            'name': name,
            'urls': [u.strip() for u in imgs_str.split(',') if u.strip()]
        })

unmatched = []
matched_dict = {}

for item in all_items:
    sku_c = clean(item['sku'])
    name_c = clean(item['name'])
    
    matches = []
    for f in files:
        f_c = clean(f)
        # Check if SKU matches or name matches
        if (sku_c and len(sku_c) > 3 and sku_c in f_c) or (name_c and len(name_c) > 6 and (name_c in f_c or f_c.startswith(name_c[:10]))):
            matches.append(f)
            
    if matches:
        matched_dict[item['sku'] or item['name']] = matches
    else:
        unmatched.append(item)

print(f"Products matched to local files: {len(matched_dict)} / {len(all_items)}")
print(f"Products unmatched: {len(unmatched)}")

print("\nSample Unmatched Products:")
for u in unmatched[:15]:
    print(f"- [{u['sheet_key'].upper()}] SKU: '{u['sku']}' | Name: '{u['name']}' | Drive URLs: {len(u['urls'])}")

