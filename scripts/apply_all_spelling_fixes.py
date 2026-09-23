import json
import re
import shutil
import glob
import os

# 1. Copy azure-blue images to properly spelled filenames
for i in range(1, 5):
    old_f = f"public/images/products/azure-blue-hand-emroidered-kurta-{i}.webp"
    new_f = f"public/images/products/azure-blue-hand-embroidered-kurta-{i}.webp"
    if os.path.exists(old_f):
        shutil.copyfile(old_f, new_f)
        print(f"Copied {old_f} -> {new_f}")

# 2. Update Collections.jsx if referencing old image name
coll_path = "components/Collections.jsx"
if os.path.exists(coll_path):
    with open(coll_path, 'r', encoding='utf-8') as f:
        c_txt = f.read()
    c_txt = c_txt.replace("azure-blue-hand-emroidered-kurta-1.webp", "azure-blue-hand-embroidered-kurta-1.webp")
    with open(coll_path, 'w', encoding='utf-8') as f:
        f.write(c_txt)
    print("Updated components/Collections.jsx image reference.")

# 3. Define all text cleanups
text_replacements = [
    # Typos
    (r'\bEmroidered\b', 'Embroidered'),
    (r'\bemroidered\b', 'embroidered'),
    (r'\bembroided\b', 'embroidered'),
    (r'\bembroidred\b', 'embroidered'),
    (r'\bemroidery\b', 'embroidery'),
    (r'\be,nbroidery\b', 'embroidery'),
    (r'\bnbroidery\b', 'embroidery'),
    (r'\bbloues\b', 'blouse'),
    (r'\bBloues\b', 'Blouse'),
    (r'\bvelevt\b', 'velvet'),
    (r'\belelgance\b', 'elegance'),
    (r'\bcraftmanship\b', 'craftsmanship'),
    (r'\bmaster piece\b', 'masterpiece'),
    (r'\bmotis\b', 'motifs'),
    (r'\bShewani\b', 'Sherwani'),
    (r'\bshewani\b', 'sherwani'),
    (r'\bgreybandhgala\b', 'grey bandhgala'),
    (r'\btraditonal\b', 'traditional'),
    (r'\bdimesnsion\b', 'dimension'),
    (r'\bintrictae\b', 'intricate'),
    (r'\bslseeves\b', 'sleeves'),
    (r'\binitimate\b', 'intimate'),
    (r'\bvertcial\b', 'vertical'),
    (r'\bcraeting\b', 'creating'),
    (r'\bmettallic\b', 'metallic'),
    (r'\bweding\b', 'wedding'),
    (r'\bbottel\b', 'bottle'),
    (r'\bpalyful\b', 'playful'),
    (r'\bstuctured\b', 'structured'),
    (r'\bcelebartions\b', 'celebrations'),
    (r'\bcelebartion\b', 'celebration'),
    (r'\boccassions\b', 'occasions'),
    (r'\boccassion\b', 'occasion'),
    (r'\bivroy\b', 'ivory'),
    (r'\bIvroy\b', 'Ivory'),
    # Punctuation & spacing
    (r'clean , linear', 'clean, linear'),
    (r'occassions,sangeet', 'occasions, sangeet'),
    (r'with  vertical', 'with vertical'),
    (r'silk,it is', 'silk, it is'),
    (r'chest,exuding', 'chest, exuding'),
    (r'dense,tonal', 'dense, tonal'),
    (r'subtle,textured', 'subtle, textured'),
    (r'saree -it\'s', 'saree - it\'s'),
    (r'events,art', 'events, art'),
    (r'Radiating  Sunburst', 'Radiating Sunburst'),
    (r'\bGrey Pin Tuck kurta\b', 'Grey Pin Tuck Kurta'),
    # Set includes formatting (spaces between numbers and words)
    (r'1Bottom', '1 Bottom'),
    (r'1Dupatta', '1 Dupatta'),
    (r'1Bustier', '1 Bustier'),
    (r'1Jacket', '1 Jacket'),
    (r'1Crop', '1 Crop'),
    (r'1Top', '1 Top'),
    (r'1SKIRT', '1 Skirt'),
    (r'1Skirt', '1 Skirt'),
    (r'1Sharara', '1 Sharara'),
    (r'1Potli', '1 Potli'),
    (r'1Bootcut pant, 1Bustier,  1Jacket', '1 Bootcut Pant 1 Bustier 1 Jacket'),
    (r'1 Skirt, 1Bustier, 1Crop Jacket', '1 Skirt 1 Bustier 1 Crop Jacket'),
    (r'1 Top, 1 Skirt', '1 Top 1 Skirt'),
    (r'1 Skort Skirt 1Top', '1 Skort Skirt 1 Top'),
    (r'  +', ' '),
]

def clean_value(val):
    if not isinstance(val, str):
        return val
    s = val
    for pat, rep in text_replacements:
        s = re.sub(pat, rep, s)
    return s.strip()

# 4. Update lib/data/products.json and components/shop/products.json
for ppath in ['lib/data/products.json', 'components/shop/products.json']:
    with open(ppath, 'r', encoding='utf-8') as f:
        prods = json.load(f)
    
    for p in prods:
        for k in ['name', 'subCategory', 'setIncludes', 'fabric', 'washCare', 'description', 'disclaimer', 'shippingDetails']:
            if p.get(k):
                p[k] = clean_value(p[k])
        # Also update images for azure blue if needed
        if p.get('id') == 'azure-blue-hand-emroidered-kurta':
            p['images'] = [img.replace('emroidered', 'embroidered') for img in p.get('images', [])]

    with open(ppath, 'w', encoding='utf-8') as f:
        json.dump(prods, f, indent=2, ensure_ascii=False)
    print(f"Updated {ppath} with all cleaned spelling and formatting!")

# 5. Update scratch/parsed_sheets.json
sheet_path = 'scratch/parsed_sheets.json'
with open(sheet_path, 'r', encoding='utf-8') as f:
    sheets = json.load(f)

for sheet_name, items in sheets.items():
    for item in items:
        for k in list(item.keys()):
            if item.get(k):
                item[k] = clean_value(item[k])

with open(sheet_path, 'w', encoding='utf-8') as f:
    json.dump(sheets, f, indent=2, ensure_ascii=False)
print("Updated scratch/parsed_sheets.json with all cleaned spelling and formatting!")

