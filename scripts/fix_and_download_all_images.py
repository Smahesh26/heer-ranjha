import json
import os
import re
import urllib.request

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

img_dir = 'public/images/products'
os.makedirs(img_dir, exist_ok=True)
files = os.listdir(img_dir)

# Build sheet drive URLs map by SKU and Name
drive_urls_map = {}
for sheet_key, items in sheets.items():
    for item in items:
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        urls_raw = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        urls = [u.strip() for u in urls_raw.split(',') if u.strip()]
        
        if urls:
            if sku: drive_urls_map[sku.lower()] = urls
            if name: drive_urls_map[name.lower()] = urls

# Token matching setup
STOPWORDS = {'hand', 'embroidered', 'set', 'wear', 'mens', 'womens', 'with', 'and', 'for', 'the', 'in', 'piece', 'pc', '3pc', '2pc'}

def get_tokens(text):
    words = re.findall(r'[a-z0-9]+', str(text).lower())
    return set(w for w in words if w not in STOPWORDS and len(w) > 1)

file_tokens = []
for f in files:
    name_no_ext = os.path.splitext(f)[0]
    base_name = re.sub(r'-\d+$', '', name_no_ext)
    file_tokens.append({
        'filename': f,
        'base': base_name,
        'tokens': get_tokens(base_name)
    })

file_groups = {}
for ft in file_tokens:
    file_groups.setdefault(ft['base'], []).append(ft['filename'])

for base in file_groups:
    file_groups[base].sort(key=lambda x: int(re.search(r'-(\d+)\.(webp|jpeg|jpg|png)$', x).group(1)) if re.search(r'-(\d+)\.(webp|jpeg|jpg|png)$', x) else 99)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Processing image assignment & downloads for {len(products)} products...")

downloaded_count = 0
matched_count = 0
fallback_count = 0

def download_drive_url(url, dest_path):
    m = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if not m:
        return False
    drive_id = m.group(1)
    dl_url = f'https://drive.google.com/uc?id={drive_id}&export=download'
    try:
        req = urllib.request.Request(dl_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            if len(data) > 5000: # ensure valid image payload
                with open(dest_path, 'wb') as out:
                    out.write(data)
                return True
    except Exception as e:
        print(f"  Download error for {url}: {e}")
    return False

for p in products:
    p_tokens = get_tokens(p['name']) | get_tokens(p.get('sku', '')) | get_tokens(p.get('subCategory', ''))
    
    color_tokens = set()
    for col in ['black', 'blue', 'green', 'olive', 'yellow', 'mustard', 'red', 'pink', 'grey', 'beige', 'peach', 'purple', 'wine', 'maroon', 'ivory', 'cream', 'white', 'teal', 'navy', 'brown', 'silver']:
        if col in p['name'].lower() or col in p.get('sku', '').lower():
            color_tokens.add(col)

    # 1. Try local matching first
    best_base = None
    best_score = 0
    for base, group_files in file_groups.items():
        b_tokens = get_tokens(base)
        if color_tokens and not (color_tokens & b_tokens):
            continue
        overlap = len(p_tokens & b_tokens)
        score = overlap / (len(p_tokens) + 0.1)
        if score > best_score and overlap >= 2:
            best_score = score
            best_base = base

    if best_base:
        matched_count += 1
        p['images'] = [f"/images/products/{fn}" for fn in file_groups[best_base]]
    else:
        # 2. Try downloading drive URLs if available
        sku_key = (p.get('sku') or '').lower()
        name_key = (p.get('name') or '').lower()
        urls = drive_urls_map.get(sku_key) or drive_urls_map.get(name_key) or []
        
        downloaded_imgs = []
        if urls:
            print(f"Downloading Drive images for [{p.get('sku')}] {p['name']} ({len(urls)} URLs)...")
            for u_idx, u in enumerate(urls[:3]):
                ext = 'jpg'
                dest_file = f"{p['slug']}-{u_idx+1}.{ext}"
                dest_full = os.path.join(img_dir, dest_file)
                if os.path.exists(dest_full) or download_drive_url(u, dest_full):
                    downloaded_imgs.append(f"/images/products/{dest_file}")
                    
        if downloaded_imgs:
            downloaded_count += 1
            p['images'] = downloaded_imgs
        else:
            # 3. Fallback to existing product image of same category/color
            fallback_count += 1
            # Find any image with matching color or default
            fallback_img = "/images/products/green-matka-silk-embroidered-kurta-1.webp"
            for fn in files:
                if color_tokens and any(c in fn.lower() for c in color_tokens):
                    fallback_img = f"/images/products/{fn}"
                    break
            p['images'] = [fallback_img]
            print(f"  Fallback assigned for [{p.get('sku')}] {p['name']}: {fallback_img}")

print(f"\nFinal Image Assignment Results:")
print(f"  Matched existing local images: {matched_count}")
print(f"  Downloaded from Drive: {downloaded_count}")
print(f"  Fallback assigned: {fallback_count}")

# Verify 0 broken images across all 120 products!
missing_files = []
for p in products:
    for img in p.get('images', []):
        full_p = os.path.join(os.getcwd(), 'public', img.lstrip('/'))
        if not os.path.exists(full_p):
            missing_files.append((p['name'], img))

print(f"\nVerification Check: Missing files count = {len(missing_files)}")

# Save to both json files
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Saved updated products.json files successfully!")

