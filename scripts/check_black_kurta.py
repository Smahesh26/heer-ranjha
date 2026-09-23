import json

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

print("=== SEARCHING FOR BLACK KURTA ITEMS IN 3 EXCEL SHEETS ===")

for sheet_key, items in sheets.items():
    for idx, item in enumerate(items):
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        cat = (item.get('Product Category') or '').strip()
        subcat = (item.get('Product Sub Category') or '').strip()
        coll = (item.get('Collection') or '').strip()
        set_inc = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        desc = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        imgs = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        
        if 'black' in name.lower() and 'kurta' in name.lower():
            print(f"Sheet: [{sheet_key.upper()}] Row: {idx+1}")
            print(f"  SKU         : '{sku}'")
            print(f"  Name        : '{name}'")
            print(f"  Category    : '{cat}'")
            print(f"  SubCategory : '{subcat}'")
            print(f"  Collection  : '{coll}'")
            print(f"  Set Includes: '{set_inc}'")
            print(f"  Description : '{desc}'")
            print(f"  Drive URLs  : '{imgs}'")
            print("  ---------------------------------------------")

print("\n=== IN PRODUCTS.JSON ===")
with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if 'black' in p['name'].lower() and 'kurta' in p['name'].lower():
        print(f"ID: {p['id']} | SKU: {p.get('sku')} | Name: {p['name']} | Cat: {p['category']} | Sub: {p['subCategory']} | Coll: {p['collection']} | Images: {p['images']}")

