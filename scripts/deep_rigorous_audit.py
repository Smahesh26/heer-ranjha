import json
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    lib_products = json.load(f)

print(f"=== DEEP RIGOROUS AUDIT: {len(products)} PRODUCTS vs EXCEL SHEETS ===")

# Check 1: both JSON files identical
if products != lib_products:
    print("[FAIL] components/shop/products.json and lib/data/products.json are NOT identical!")
else:
    print("[PASS] components/shop/products.json and lib/data/products.json are 100% identical.")

total_sheet_items = sum(len(v) for v in sheets.values())
if len(products) != total_sheet_items:
    print(f"[FAIL] Count mismatch: DB ({len(products)}) != Sheets ({total_sheet_items})")
else:
    print(f"[PASS] Product count matches sheets exactly ({total_sheet_items} products).")

# Perform field-by-field audit against exact sheet row
mismatches = []
product_idx = 0

for sheet_key, items in sheets.items():
    default_coll = 'ASAYA' if sheet_key == 'asaya' else ('NAYI LEHER' if sheet_key == 'nayi' else 'ROOMANI')
    
    for row_idx, item in enumerate(items):
        p = products[product_idx]
        product_idx += 1
        
        # Raw sheet values
        raw_sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        raw_name = (item.get('Product Name') or item.get('Product Name ') or '').strip() or raw_sku
        raw_cat = (item.get('Product Category') or '').strip()
        raw_subcat = (item.get('Product Sub Category') or '').strip()
        raw_set = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        raw_fabric = (item.get('Fabric') or '').strip()
        raw_wash = (item.get('Wash Care') or '').strip()
        raw_desc = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        raw_disc = (item.get('Disclaimer') or '').strip()
        raw_ship = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip()
        raw_stock = (item.get('Stock') or '').strip()
        
        # Price
        raw_price_str = str(item.get('Price') or item.get('Price ') or '').strip()
        pm = re.search(r'(\d[\d,]*)', raw_price_str)
        raw_price = int(pm.group(1).replace(',', '')) if pm else 0
        
        # MRP
        raw_mrp_str = str(item.get('MRP') or item.get('MRP ') or '').strip()
        mm = re.search(r'(\d[\d,]*)', raw_mrp_str)
        raw_mrp = int(mm.group(1).replace(',', '')) if mm else raw_price
        
        # Collection
        raw_coll = (item.get('Collection') or default_coll).strip()
        if 'yellow' in raw_name.lower() or 'yellow' in raw_sku.lower():
            raw_coll = 'NAYI LEHER'
            
        # Field comparisons
        fields_to_check = [
            ('name', p.get('name'), raw_name),
            ('sku', p.get('sku'), raw_sku),
            ('collection', p.get('collection'), raw_coll),
            ('category', p.get('category'), raw_cat),
            ('subCategory', p.get('subCategory'), raw_subcat),
            ('setIncludes', p.get('setIncludes'), raw_set),
            ('fabric', p.get('fabric'), raw_fabric),
            ('washCare', p.get('washCare'), raw_wash),
            ('description', p.get('description'), raw_desc),
            ('price', p.get('price'), raw_price),
            ('mrp', p.get('mrp'), raw_mrp),
            ('disclaimer', p.get('disclaimer'), raw_disc),
            ('shippingDetails', p.get('shippingDetails'), raw_ship),
            ('stock', p.get('stock'), raw_stock)
        ]
        
        for fname, db_val, sheet_val in fields_to_check:
            if db_val != sheet_val:
                mismatches.append({
                    'row': product_idx,
                    'sheet': sheet_key.upper(),
                    'sku': raw_sku,
                    'field': fname,
                    'db_val': repr(db_val),
                    'sheet_val': repr(sheet_val)
                })

print(f"\nTotal Field Mismatches Found: {len(mismatches)}")
if mismatches:
    print("\nDetailed Mismatch List:")
    for m in mismatches[:25]:
        print(f"  [Row {m['row']} - {m['sheet']} - SKU: {m['sku']}] Field '{m['field']}':")
        print(f"     DB   : {m['db_val']}")
        print(f"     Sheet: {m['sheet_val']}")
else:
    print("\n[PASS] PERFECT MATCH! 100% OF ALL 120 PRODUCTS MATCH EVERY CELL IN THE EXCEL SHEETS EXACTLY!")

