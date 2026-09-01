import json
import os
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

img_dir = 'public/images/products'
files = os.listdir(img_dir) if os.path.exists(img_dir) else []

# Clean token set
STOPWORDS = {'hand', 'embroidered', 'set', 'wear', 'mens', 'womens', 'with', 'and', 'for', 'the', 'in', 'piece', 'pc', '3pc', '2pc'}

def get_tokens(text):
    words = re.findall(r'[a-z0-9]+', str(text).lower())
    return set(w for w in words if w not in STOPWORDS and len(w) > 1)

file_tokens = []
for f in files:
    name_no_ext = os.path.splitext(f)[0]
    # remove trailing digits (-1, -2) for matching
    base_name = re.sub(r'-\d+$', '', name_no_ext)
    file_tokens.append({
        'filename': f,
        'base': base_name,
        'tokens': get_tokens(base_name)
    })

# Build lookup by base name
file_groups = {}
for ft in file_tokens:
    file_groups.setdefault(ft['base'], []).append(ft['filename'])

# Sort each group by trailing index (-1, -2, -3)
for base in file_groups:
    file_groups[base].sort(key=lambda x: int(re.search(r'-(\d+)\.webp$', x).group(1)) if re.search(r'-(\d+)\.webp$', x) else 99)

all_products = []
with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

print(f"Testing smart matching for {len(all_products)} products across {len(files)} image files...\n")

matched_count = 0
unmatched_list = []

for p in all_products:
    p_tokens = get_tokens(p['name']) | get_tokens(p.get('sku', '')) | get_tokens(p.get('subCategory', ''))
    
    # Also get color if present
    color_tokens = set()
    for col in ['black', 'blue', 'green', 'olive', 'yellow', 'mustard', 'red', 'pink', 'grey', 'beige', 'peach', 'purple', 'wine', 'maroon', 'ivory', 'cream', 'white', 'teal', 'navy']:
        if col in p['name'].lower() or col in p.get('sku', '').lower():
            color_tokens.add(col)

    best_base = None
    best_score = 0
    
    for base, group_files in file_groups.items():
        b_tokens = get_tokens(base)
        
        # Color match requirement if product has color
        if color_tokens and not (color_tokens & b_tokens):
            continue
            
        overlap = len(p_tokens & b_tokens)
        score = overlap / (len(p_tokens) + 0.1)
        
        if score > best_score and overlap >= 2:
            best_score = score
            best_base = base
            
    if best_base:
        matched_count += 1
        p_imgs = [f"/images/products/{fn}" for fn in file_groups[best_base]]
        # print(f"MATCH [{p['sku']}]: '{p['name']}' -> {file_groups[best_base][:2]}")
    else:
        unmatched_list.append(p)

print(f"Matched count: {matched_count} / {len(all_products)}")
print(f"Unmatched count: {len(unmatched_list)}")

print("\nSample Unmatched:")
for u in unmatched_list[:15]:
    print(f"- [{u['sku']}] '{u['name']}' (Color: {[c for c in ['black', 'blue', 'green', 'olive', 'yellow', 'mustard', 'red', 'pink', 'grey', 'beige', 'peach', 'purple', 'wine', 'maroon', 'ivory', 'cream', 'white', 'teal', 'navy'] if c in u['name'].lower()]})")

