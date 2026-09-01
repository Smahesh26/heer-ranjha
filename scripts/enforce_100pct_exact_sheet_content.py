import json
import re
import os

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

# Load existing products to preserve working image array mappings
existing_products_map = {}
if os.path.exists('components/shop/products.json'):
    with open('components/shop/products.json', 'r', encoding='utf-8') as f:
        for p in json.load(f):
            if p.get('sku'):
                existing_products_map[p['sku'].lower()] = p
            if p.get('name'):
                existing_products_map[p['name'].lower()] = p

def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

exact_120_products = []
item_counter = 0

for sheet_key, items in sheets.items():
    default_coll = 'ASAYA' if sheet_key == 'asaya' else ('NAYI LEHER' if sheet_key == 'nayi' else 'ROOMANI')
    
    for idx, item in enumerate(items):
        item_counter += 1
        
        # 1. Collection
        coll = (item.get('Collection') or default_coll).strip()
        
        # 2. SKU / Style Code
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        
        # 3. Product Name
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        if not name and sku:
            name = sku
            
        # FORCE YELLOW OUTFIT COLLECTION TO NAYI LEHER
        if 'yellow' in name.lower() or 'yellow' in sku.lower():
            coll = 'NAYI LEHER'
            
        slug = slugify(name)
        if not slug:
            slug = f"product-{item_counter}"
            
        # 4. Category & SubCategory (EXACT)
        category = (item.get('Product Category') or '').strip()
        subCategory = (item.get('Product Sub Category') or '').strip()
        
        # 5. Set Includes (EXACT - NO EXTRA ADDITION)
        setIncludes = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        
        # 6. Fabric (EXACT)
        fabric = (item.get('Fabric') or '').strip()
        
        # 7. Wash Care (EXACT - NO EXTRA ADDITION IF EMPTY)
        washCare = (item.get('Wash Care') or '').strip()
        
        # 8. Product Highlights / Description (EXACT - NO EXTRA ADDITION IF EMPTY)
        description = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        
        # 9. Price & MRP (EXACT)
        price_raw = str(item.get('Price') or item.get('Price ') or '').strip()
        mrp_raw = str(item.get('MRP') or item.get('MRP ') or '').strip()
        
        price_num = 0
        price_match = re.search(r'(\d[\d,]*)', price_raw)
        if price_match:
            price_num = int(price_match.group(1).replace(',', ''))
            
        mrp_num = price_num
        mrp_match = re.search(r'(\d[\d,]*)', mrp_raw)
        if mrp_match:
            mrp_num = int(mrp_match.group(1).replace(',', ''))
            
        # 10. Disclaimer & Shipping Details (EXACT FROM SHEET CELL ONLY)
        disclaimer = (item.get('Disclaimer') or '').strip()
        shippingDetails = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip()
        
        # 11. Stock & Active
        stock = (item.get('Stock') or '').strip()
        active_str = str(item.get('Active(Yes/No)') or 'Yes').strip().lower()
        active = active_str != 'no'
        
        # Preserve working images list from verified map
        matched_p = existing_products_map.get(sku.lower()) or existing_products_map.get(name.lower())
        images = matched_p['images'] if matched_p and matched_p.get('images') else [f"/images/products/{slug}-1.webp"]
        
        product = {
            "id": slug,
            "name": name,
            "slug": slug,
            "sku": sku,
            "styleCode": sku,
            "collection": coll,
            "category": category,
            "subCategory": subCategory,
            "setIncludes": setIncludes,
            "fabric": fabric,
            "washCare": washCare,
            "description": description,
            "price": price_num,
            "mrp": mrp_num,
            "disclaimer": disclaimer,
            "shippingDetails": shippingDetails,
            "stock": stock,
            "active": active,
            "images": images
        }
        exact_120_products.append(product)

# Resolve any duplicate slugs
seen_slugs = {}
for p in exact_120_products:
    s = p['slug']
    if s in seen_slugs:
        seen_slugs[s] += 1
        p['slug'] = f"{s}-{seen_slugs[s]}"
        p['id'] = p['slug']
    else:
        seen_slugs[s] = 1

print(f"Rebuilt EXACT {len(exact_120_products)} products with ONLY sheet cell data!")

# Write to both JSON files
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_120_products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_120_products, f, indent=2, ensure_ascii=False)

print("Saved clean 100% exact products.json files successfully!")

