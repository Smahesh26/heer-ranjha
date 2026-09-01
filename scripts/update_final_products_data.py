import json
import re
import os

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

# Parse sheet items
all_sheet_items = []
for sheet_key, items in sheets.items():
    for item in items:
        coll = (item.get('Collection') or '').strip()
        if not coll:
            if sheet_key == 'asaya': coll = 'ASAYA'
            elif sheet_key == 'nayi': coll = 'NAYI LEHER'
            elif sheet_key == 'roomani': coll = 'ROOMANI'
            
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        cat = (item.get('Product Category') or '').strip()
        subcat = (item.get('Product Sub Category') or '').strip()
        set_inc = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        fabric = (item.get('Fabric') or '').strip()
        wash = (item.get('Wash Care') or '').strip() or "Dry Clean Only"
        desc = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        price_raw = str(item.get('Price') or item.get('Price ') or '').strip()
        mrp_raw = str(item.get('MRP') or item.get('MRP ') or '').strip()
        disc = (item.get('Disclaimer') or '').strip() or "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Product colours may vary slightly due to lighting and screen settings."
        ship = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip() or "Free shipping across India on all orders. Made-To-Order timeline: 2-3 weeks."
        
        price_num = 0
        price_match = re.search(r'(\d[\d,]*)', price_raw)
        if price_match:
            price_num = int(price_match.group(1).replace(',', ''))
            
        mrp_num = price_num
        mrp_match = re.search(r'(\d[\d,]*)', mrp_raw)
        if mrp_match:
            mrp_num = int(mrp_match.group(1).replace(',', ''))
            
        # FORCE YELLOW SET TO NAYI LEHER
        if 'yellow' in name.lower() or 'yellow' in sku.lower():
            coll = 'NAYI LEHER'
            
        all_sheet_items.append({
            'sheet_key': sheet_key,
            'sku': sku,
            'name': name,
            'collection': coll,
            'category': cat,
            'subCategory': subcat,
            'setIncludes': set_inc,
            'fabric': fabric,
            'washCare': wash,
            'description': desc,
            'price': price_num,
            'mrp': mrp_num,
            'disclaimer': disc,
            'shippingDetails': ship
        })

print(f"Loaded {len(all_sheet_items)} items from final sheets.")

# Existing products map by id and by name/sku
updated_products = []
used_sheet_indices = set()

def name_similarity(a, b):
    a_clean = re.sub(r'[^a-z0-9]', '', a.lower())
    b_clean = re.sub(r'[^a-z0-9]', '', b.lower())
    return a_clean == b_clean or a_clean in b_clean or b_clean in a_clean

for p in products:
    p_name = p.get('name', '')
    p_sku = p.get('sku') or p.get('styleCode') or ''
    
    match_idx = None
    if p_sku:
        for idx, s in enumerate(all_sheet_items):
            if s['sku'] and s['sku'].lower() == p_sku.lower():
                match_idx = idx
                break
                
    if match_idx is None:
        for idx, s in enumerate(all_sheet_items):
            if idx not in used_sheet_indices and name_similarity(p_name, s['name']):
                match_idx = idx
                break
                
    new_p = dict(p)
    if match_idx is not None:
        used_sheet_indices.add(match_idx)
        s = all_sheet_items[match_idx]
        
        new_p['name'] = s['name'] if s['name'] else p['name']
        new_p['sku'] = s['sku'] or p.get('sku') or p.get('styleCode')
        new_p['styleCode'] = new_p['sku']
        new_p['collection'] = s['collection']
        new_p['setIncludes'] = s['setIncludes'] if s['setIncludes'] else p.get('setIncludes')
        new_p['description'] = s['description'] if s['description'] else p.get('description')
        new_p['fabric'] = s['fabric'] if s['fabric'] else p.get('fabric')
        new_p['washCare'] = s['washCare']
        new_p['disclaimer'] = s['disclaimer']
        new_p['shippingDetails'] = s['shippingDetails']
        if s['price'] > 0:
            new_p['price'] = s['price']
            new_p['mrp'] = s['mrp'] if s['mrp'] > 0 else s['price']
    else:
        # If unmatched existing product, check yellow
        if 'yellow' in p['name'].lower():
            new_p['collection'] = 'NAYI LEHER'
            
    updated_products.append(new_p)

# Now add any sheet items that were not in existing products.json!
missing_count = 0
for idx, s in enumerate(all_sheet_items):
    if idx not in used_sheet_indices:
        missing_count += 1
        slug = slugify(s['name'] or f"product-{missing_count}")
        new_id = slug
        
        # Build image path based on slug or category
        images = [f"/images/products/{slug}-1.webp", f"/images/products/{slug}-2.webp"]
        
        new_p = {
            "id": new_id,
            "name": s['name'],
            "slug": slug,
            "sku": s['sku'],
            "styleCode": s['sku'],
            "collection": s['collection'],
            "category": s['category'] or "Men's Wear",
            "subCategory": s['subCategory'] or "Kurta",
            "setIncludes": s['setIncludes'],
            "fabric": s['fabric'] or "Matka Silk",
            "washCare": s['washCare'],
            "description": s['description'] or f"{s['name']} crafted in high quality fabric with fine details.",
            "price": s['price'] if s['price'] > 0 else 18500,
            "mrp": s['mrp'] if s['mrp'] > 0 else 18500,
            "disclaimer": s['disclaimer'],
            "shippingDetails": s['shippingDetails'],
            "stock": "MTO",
            "active": True,
            "featured": False,
            "images": images,
            "createdAt": "2026-08-31T00:00:00.000Z"
        }
        updated_products.append(new_p)

print(f"Added {missing_count} new products from sheets!")
print(f"Total updated product count: {len(updated_products)}")

# Verify Yellow set collections
yellow_count = 0
for p in updated_products:
    if 'yellow' in p['name'].lower() or 'yellow' in (p.get('sku') or '').lower():
        yellow_count += 1
        print(f"YELLOW PRODUCT: [{p.get('sku')}] '{p['name']}' -> Collection: '{p['collection']}', SetIncludes: '{p['setIncludes']}'")

# Write to components/shop/products.json and lib/data/products.json
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(updated_products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(updated_products, f, indent=2, ensure_ascii=False)

print("\nSuccessfully updated components/shop/products.json AND lib/data/products.json!")

