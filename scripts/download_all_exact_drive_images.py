import json
import re
import os
import subprocess

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("=== DOWNLOADING ALL EXACT IMAGES FROM GOOGLE DRIVE URLS ===")

# Build a mapping of SKU -> list of Drive URLs
sku_to_drive_urls = {}

for sheet_key, items in sheets.items():
    for item in items:
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        urls_str = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        urls = [u.strip() for u in urls_str.split(',') if u.strip()]
        
        if urls:
            if sku: sku_to_drive_urls[sku.lower()] = urls
            if name: sku_to_drive_urls[name.lower()] = urls

downloaded_count = 0
updated_products = 0

for p in products:
    sku = p.get('sku', '').lower()
    name = p.get('name', '').lower()
    slug = p.get('slug')
    
    urls = sku_to_drive_urls.get(sku) or sku_to_drive_urls.get(name)
    if not urls:
        continue
        
    new_images = []
    for idx, drive_url in enumerate(urls):
        m = re.search(r'/d/([a-zA-Z0-9_-]+)', drive_url)
        if not m:
            continue
        file_id = m.group(1)
        
        filename = f"{slug}-{idx+1}.jpg"
        rel_path = f"/images/products/{filename}"
        abs_path = os.path.join(os.getcwd(), 'public', 'images', 'products', filename)
        
        # Download via curl.exe if not already downloaded or if small
        if not os.path.exists(abs_path) or os.path.getsize(abs_path) < 2000:
            direct_url = f"https://lh3.googleusercontent.com/d/{file_id}"
            cmd = f'curl.exe -s -L "{direct_url}" -o "{abs_path}"'
            subprocess.run(cmd, shell=True)
            
            if os.path.exists(abs_path) and os.path.getsize(abs_path) > 2000:
                downloaded_count += 1
                print(f"[SUCCESS] Downloaded [{p['sku']}] photo #{idx+1}: {filename} ({os.path.getsize(abs_path)} bytes)")
            else:
                # Try fallback drive url
                fallback_url = f"https://drive.google.com/uc?export=download&id={file_id}"
                cmd2 = f'curl.exe -s -L "{fallback_url}" -o "{abs_path}"'
                subprocess.run(cmd2, shell=True)
                if os.path.exists(abs_path) and os.path.getsize(abs_path) > 2000:
                    downloaded_count += 1
                    print(f"[SUCCESS-FB] Downloaded [{p['sku']}] photo #{idx+1}: {filename} ({os.path.getsize(abs_path)} bytes)")
                else:
                    print(f"[FAIL] Could not download [{p['sku']}] photo #{idx+1} from {drive_url}")
                    
        if os.path.exists(abs_path) and os.path.getsize(abs_path) > 2000:
            new_images.append(rel_path)
            
    if new_images:
        p['images'] = new_images
        updated_products += 1

print(f"\nSuccessfully updated image arrays for {updated_products} products!")
print(f"Total new images downloaded: {downloaded_count}")

# Save updated products to both JSON files
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Saved updated products.json files successfully!")

