import json

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Loaded {len(products)} products from products.json")

# 1. Search for yellow items in sheets and products.json
print("\n================ 1. YELLOW OUTFITS SEARCH ================")
for sheet_name, items in sheets.items():
    for item in items:
        name = item.get('Product Name') or item.get('Product Name ') or ''
        desc = item.get('Product Highlights (Description)') or item.get('Description') or ''
        color = item.get('Color') or item.get('Colour') or ''
        sku = item.get('SKU') or item.get('Style Code') or item.get('COLLECTION 2nd') or ''
        coll = item.get('Collection') or ''
        
        all_text = f"{name} {desc} {color} {sku}".lower()
        if 'yellow' in all_text or 'mustard' in all_text or 'turmeric' in all_text or 'pithora' in all_text or 'haldi' in all_text or 'lemon' in all_text or 'sunshine' in all_text:
            print(f"SHEET [{sheet_name.upper()}]: SKU='{sku}', Name='{name}', Collection='{coll}', SetIncludes='{item.get('Set Includes') or item.get('Set includes')}'")

print("\n--- In products.json ---")
for p in products:
    all_text = f"{p.get('name')} {p.get('description')} {p.get('color')} {p.get('sku')} {p.get('styleCode')}".lower()
    if 'yellow' in all_text or 'mustard' in all_text or 'turmeric' in all_text or 'pithora' in all_text or 'haldi' in all_text or 'lemon' in all_text or 'sunshine' in all_text:
        print(f"PRODUCTS.JSON: ID='{p.get('id')}', SKU='{p.get('sku') or p.get('styleCode')}', Name='{p.get('name')}', Collection='{p.get('collection')}', SetIncludes='{p.get('setIncludes')}'")

# 2. Check Set Includes discrepancies
print("\n================ 2. SET INCLUDES ANALYSIS ================")
sheet_set_inc_counts = {}
for sheet_name, items in sheets.items():
    sheet_set_inc_counts[sheet_name] = {}
    for item in items:
        val = item.get('Set Includes') or item.get('Set includes') or 'NOT SPECIFIED'
        sheet_set_inc_counts[sheet_name][val] = sheet_set_inc_counts[sheet_name].get(val, 0) + 1

print("Set Includes in Corrected Sheets:")
print(json.dumps(sheet_set_inc_counts, indent=2))

pj_set_inc_counts = {}
for p in products:
    val = p.get('setIncludes') or 'NOT SPECIFIED'
    pj_set_inc_counts[val] = pj_set_inc_counts.get(val, 0) + 1

print("\nSet Includes in products.json:")
print(json.dumps(pj_set_inc_counts, indent=2))

# 3. Check for products in products.json whose SetIncludes or Collection don't match the corrected sheets
print("\n================ 3. DISCREPANCIES BETWEEN SHEETS AND PRODUCTS.JSON ================")
mismatches = []
for p in products:
    sku_p = (p.get('sku') or p.get('styleCode') or '').strip().lower()
    name_p = (p.get('name') or '').strip().lower()
    
    # Try to match in sheets by SKU or Name
    matched_item = None
    matched_sheet = None
    for sheet_name, items in sheets.items():
        for item in items:
            sku_s = (item.get('SKU') or item.get('Style Code') or item.get('COLLECTION 2nd') or '').strip().lower()
            name_s = (item.get('Product Name') or item.get('Product Name ') or '').strip().lower()
            
            if (sku_p and sku_s and sku_p == sku_s) or (name_p and name_s and name_p == name_s):
                matched_item = item
                matched_sheet = sheet_name
                break
        if matched_item:
            break
            
    if matched_item:
        s_coll = matched_item.get('Collection') or ''
        s_set = matched_item.get('Set Includes') or matched_item.get('Set includes') or ''
        p_coll = p.get('collection') or ''
        p_set = p.get('setIncludes') or ''
        
        disc = []
        if s_coll and s_coll.upper() != p_coll.upper():
            disc.append(f"Collection Mismatch: Sheet='{s_coll}' vs DB='{p_coll}'")
        if s_set and s_set.lower() != p_set.lower():
            disc.append(f"SetIncludes Mismatch: Sheet='{s_set}' vs DB='{p_set}'")
            
        if disc:
            mismatches.append({
                'id': p.get('id'),
                'sku': p.get('sku') or p.get('styleCode'),
                'name': p.get('name'),
                'sheet': matched_sheet,
                'discrepancies': disc
            })

print(f"Total products matched with sheet: {len(products) - len([p for p in products if not any(p.get('id'))])}")
print(f"Total products with discrepancies: {len(mismatches)}")
print("\nFirst 15 Mismatches:")
for m in mismatches[:15]:
    print(f"- [{m['sku']}] {m['name']} ({m['sheet']}): {', '.join(m['discrepancies'])}")

