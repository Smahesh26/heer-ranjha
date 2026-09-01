import json

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    shop_products = json.load(f)

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    lib_products = json.load(f)

print(f"components/shop/products.json count: {len(shop_products)}")
print(f"lib/data/products.json count: {len(lib_products)}")

# Check equality
assert shop_products == lib_products, "ERROR: shop and lib products.json are not identical!"
print("SUCCESS: Both products.json files are 100% identical!")

# Check yellow items
yellow_items = [p for p in shop_products if 'yellow' in (p['name'] + p['description'] + p['sku'] + p['id']).lower()]
print(f"\nTotal Yellow items found: {len(yellow_items)}")
for p in yellow_items:
    print(f"  - [{p['sku']}] {p['name']} -> Collection: '{p['collection']}', SetIncludes: '{p['setIncludes']}'")
    assert p['collection'] == 'NAYI LEHER', f"ERROR: Yellow item {p['name']} is in {p['collection']} instead of NAYI LEHER!"

print("\nAll Yellow items are verified to be in NAYI LEHER collection!")

# Check Set Includes values
set_inc_counts = {}
for p in shop_products:
    val = p.get('setIncludes') or 'MISSING'
    set_inc_counts[val] = set_inc_counts.get(val, 0) + 1

print("\nSet Includes Distribution:")
print(json.dumps(set_inc_counts, indent=2))

# Check Collections distribution
coll_counts = {}
for p in shop_products:
    c = p.get('collection') or 'MISSING'
    coll_counts[c] = coll_counts.get(c, 0) + 1

print("\nCollection Distribution:")
print(json.dumps(coll_counts, indent=2))

print("\nDATA VERIFICATION COMPLETE: ALL CHECKS PASSED PERFECTLY!")

