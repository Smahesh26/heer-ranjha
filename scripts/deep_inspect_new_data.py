import json

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

print("=== NEW SHEETS SUMMARY ===")
for sheet_name, items in sheets.items():
    print(f"\n--- Sheet: {sheet_name.upper()} ({len(items)} items) ---")
    if items:
        print("Fields available:", list(items[0].keys()))
    collections = set(item.get('Collection') for item in items)
    print("Collections present:", collections)

print("\n=== DETAILED INSPECTION OF YELLOW ITEMS IN ALL NEW SHEETS ===")
for sheet_name, items in sheets.items():
    for idx, item in enumerate(items):
        name = item.get('Product Name') or item.get('Product Name ') or ''
        desc = item.get('Product Highlights (Description)') or item.get('Description') or ''
        color = item.get('Color') or item.get('Colour') or ''
        sku = item.get('SKU') or item.get('Style Code') or item.get('COLLECTION 2nd') or ''
        coll = item.get('Collection') or ''
        set_inc = item.get('Set Includes') or item.get('Set includes') or ''
        
        all_text = f"{name} {desc} {color} {sku}".lower()
        if any(kw in all_text for kw in ['yellow', 'mustard', 'turmeric', 'pithora', 'haldi', 'lemon', 'sunshine']):
            print(f"Sheet: {sheet_name.upper()} | Row: {idx+1}")
            print(f"  SKU         : {sku}")
            print(f"  Name        : {name}")
            print(f"  Collection  : {coll}")
            print(f"  Category    : {item.get('Product Category')}")
            print(f"  SubCategory : {item.get('Product Sub Category')}")
            print(f"  Set Includes: {set_inc}")
            print(f"  Fabric      : {item.get('Fabric')}")
            print(f"  Wash Care   : {item.get('Wash Care')}")
            print(f"  Description : {desc}")
            print("  ---------------------------------------------")

