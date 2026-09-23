import json
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Loaded {len(products)} products from components/shop/products.json")

# Flatten all sheet items into a single searchable list
sheet_items = []
for sheet_key, items in sheets.items():
    for item in items:
        # Determine collection
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
        disc = (item.get('Disclaimer') or '').strip()
        ship = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip()
        imgs_raw = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        
        # Clean price
        price_num = None
        price_match = re.search(r'(\d[\d,]*)', price_raw)
        if price_match:
            price_num = int(price_match.group(1).replace(',', ''))
            
        sheet_items.append({
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
            'disclaimer': disc,
            'shippingDetails': ship,
            'imgs_raw': imgs_raw
        })

print(f"Total items across 3 final sheets: {len(sheet_items)}")

# Match and update products
updated_products = []
matched_sheet_indices = set()

def name_similarity(a, b):
    a_clean = re.sub(r'[^a-z0-9]', '', a.lower())
    b_clean = re.sub(r'[^a-z0-9]', '', b.lower())
    return a_clean == b_clean or a_clean in b_clean or b_clean in a_clean

for p in products:
    p_name = p.get('name', '')
    p_sku = p.get('sku') or p.get('styleCode') or ''
    
    # Try exact SKU match
    match_idx = None
    if p_sku:
        for idx, s in enumerate(sheet_items):
            if s['sku'] and s['sku'].lower() == p_sku.lower():
                match_idx = idx
                break
                
    # If no SKU match, try name match
    if match_idx is None:
        for idx, s in enumerate(sheet_items):
            if name_similarity(p_name, s['name']):
                match_idx = idx
                break
                
    new_p = dict(p)
    if match_idx is not None:
        s = sheet_items[match_idx]
        matched_sheet_indices.add(match_idx)
        
        # Enforce Yellow set is NAYI LEHER
        if 'yellow' in s['name'].lower() or 'yellow' in s['sku'].lower():
            if 'waistcoat' in s['name'].lower() or 'kurta' in s['name'].lower() or 'suit' in s['name'].lower():
                s['collection'] = 'NAYI LEHER'
                
        new_p['sku'] = s['sku'] or p.get('sku') or p.get('styleCode')
        new_p['styleCode'] = new_p['sku']
        new_p['collection'] = s['collection'] if s['collection'] else p.get('collection')
        new_p['setIncludes'] = s['setIncludes'] if s['setIncludes'] else p.get('setIncludes')
        if s['description']:
            new_p['description'] = s['description']
        if s['fabric']:
            new_p['fabric'] = s['fabric']
        if s['washCare']:
            new_p['washCare'] = s['washCare']
        if s['disclaimer']:
            new_p['disclaimer'] = s['disclaimer']
        if s['shippingDetails']:
            new_p['shippingDetails'] = s['shippingDetails']
        if s['price']:
            new_p['price'] = s['price']
            
        print(f"MATCHED [{p['id']}]: '{p['name']}' -> Coll: {new_p['collection']}, SetInc: '{new_p['setIncludes']}'")
    else:
        print(f"UNMATCHED IN SHEETS: '{p['name']}' (ID: {p['id']})")
        # Check if yellow in unmatched
        if 'yellow' in p['name'].lower():
            new_p['collection'] = 'NAYI LEHER'
            print(f"  -> FORCED Yellow item collection to NAYI LEHER")

    updated_products.append(new_p)

print(f"\nTotal products updated: {len(updated_products)}")
print(f"Sheet items matched: {len(matched_sheet_indices)} / {len(sheet_items)}")

# Print unmatched sheet items
unmatched_sheet_items = [s for idx, s in enumerate(sheet_items) if idx not in matched_sheet_indices]
print(f"\nUnmatched sheet items: {len(unmatched_sheet_items)}")
for u in unmatched_sheet_items:
    print(f"  - [{u['sheet_key'].upper()}] SKU: {u['sku']} | Name: '{u['name']}' | SetInc: '{u['setIncludes']}'")

