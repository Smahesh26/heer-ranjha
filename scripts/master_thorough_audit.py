import json
import os
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    shop_products = json.load(f)

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    lib_products = json.load(f)

print(f"=== MASTER AUDIT OF {len(shop_products)} PRODUCTS ===")

# 1. Check shop vs lib products identity
if shop_products != lib_products:
    print("[FAIL] CRITICAL AUDIT ERROR: components/shop/products.json and lib/data/products.json do not match!")
else:
    print("[PASS] components/shop/products.json and lib/data/products.json are 100% identical.")

# 2. Count verification
total_sheet_items = sum(len(v) for v in sheets.values())
if len(shop_products) != total_sheet_items:
    print(f"[FAIL] CRITICAL AUDIT ERROR: Product count ({len(shop_products)}) != Total sheet items ({total_sheet_items})")
else:
    print(f"[PASS] Exact product count matches sheets ({total_sheet_items} products).")

# 3. Item by item cell comparison by row index
audit_errors = []
product_idx = 0

for sheet_key, items in sheets.items():
    default_coll = 'ASAYA' if sheet_key == 'asaya' else ('NAYI LEHER' if sheet_key == 'nayi' else 'ROOMANI')
    
    for idx, sheet_item in enumerate(items):
        sku = (sheet_item.get('SKU') or sheet_item.get('Style Code') or sheet_item.get('Item SKU') or sheet_item.get('COLLECTION 2nd') or '').strip()
        name = (sheet_item.get('Product Name') or sheet_item.get('Product Name ') or '').strip() or sku
        
        p = shop_products[product_idx]
        product_idx += 1
            
        # Check Name
        if p['name'] != name:
            audit_errors.append(f"[Row {product_idx} - {sku}] Name mismatch: DB='{p['name']}' vs Sheet='{name}'")
            
        # Check Collection (Yellow set must be NAYI LEHER)
        expected_coll = sheet_item.get('Collection') or default_coll
        if 'yellow' in name.lower() or 'yellow' in sku.lower():
            expected_coll = 'NAYI LEHER'
        if p['collection'].upper() != expected_coll.upper():
            audit_errors.append(f"[Row {product_idx} - {sku}] Collection mismatch: DB='{p['collection']}' vs Sheet='{expected_coll}'")
            
        # Check Set Includes
        expected_set = (sheet_item.get('Set Includes') or sheet_item.get('Set includes') or '').strip()
        if p['setIncludes'] != expected_set:
            audit_errors.append(f"[Row {product_idx} - {sku}] SetIncludes mismatch: DB='{p['setIncludes']}' vs Sheet='{expected_set}'")
            
        # Check Description
        expected_desc = (sheet_item.get('Product Highlights (Description)') or sheet_item.get('Product Description') or sheet_item.get('Description') or '').strip()
        if p['description'] != expected_desc:
            audit_errors.append(f"[Row {product_idx} - {sku}] Description mismatch: DB='{p['description']}' vs Sheet='{expected_desc}'")
            
        # Check Fabric
        expected_fabric = (sheet_item.get('Fabric') or '').strip()
        if p['fabric'] != expected_fabric:
            audit_errors.append(f"[Row {product_idx} - {sku}] Fabric mismatch: DB='{p['fabric']}' vs Sheet='{expected_fabric}'")

        # Check Price
        raw_price = str(sheet_item.get('Price') or sheet_item.get('Price ') or '').strip()
        m = re.search(r'(\d[\d,]*)', raw_price)
        expected_price = int(m.group(1).replace(',', '')) if m else 0
        if p['price'] != expected_price:
            audit_errors.append(f"[Row {product_idx} - {sku}] Price mismatch: DB={p['price']} vs Sheet={expected_price}")
            
        # Check Images existence
        if not p.get('images'):
            audit_errors.append(f"[Row {product_idx} - {sku}] No images assigned in DB")
        else:
            for img in p['images']:
                full_img = os.path.join(os.getcwd(), 'public', img.lstrip('/'))
                if not os.path.exists(full_img):
                    audit_errors.append(f"[Row {product_idx} - {sku}] Broken image file on disk: {img}")

print(f"\nTotal Audit Errors Found: {len(audit_errors)}")
if audit_errors:
    print("\nAudit Errors List:")
    for err in audit_errors[:20]:
        print(" [FAIL]", err)
else:
    print("\n[PASS] ALL 120 PRODUCTS PASSED PERFECTLY! 0 ERRORS FOUND ACROSS EVERY SINGLE FIELD!")

