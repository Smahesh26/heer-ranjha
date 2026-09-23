import json
import re
import os

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

# Load existing products to preserve image array mappings ONLY
existing_images_by_sku = {}
if os.path.exists('components/shop/products.json'):
    with open('components/shop/products.json', 'r', encoding='utf-8') as f:
        for p in json.load(f):
            if p.get('sku'):
                existing_images_by_sku[p['sku'].lower()] = p.get('images', [])

def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

exact_products = []
item_counter = 0

for sheet_key, items in sheets.items():
    default_coll = 'ASAYA' if sheet_key == 'asaya' else ('NAYI LEHER' if sheet_key == 'nayi' else 'ROOMANI')
    
    for idx, item in enumerate(items):
        item_counter += 1
        
        # 1. Collection (EXACT FROM SHEET, unless Yellow set forced to NAYI LEHER)
        coll = (item.get('Collection') or default_coll).strip()
        
        # 2. SKU / Style Code (EXACT FROM SHEET CELL)
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        
        # 3. Product Name (EXACT FROM SHEET CELL)
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        if not name and sku:
            name = sku
            
        # FORCE YELLOW OUTFIT COLLECTION TO NAYI LEHER AS REQUESTED BY USER
        if 'yellow' in name.lower() or 'yellow' in sku.lower():
            coll = 'NAYI LEHER'
            
        slug = slugify(name)
        if not slug:
            slug = f"product-{item_counter}"
            
        # 4. Category & SubCategory (EXACT FROM SHEET CELL)
        category = (item.get('Product Category') or '').strip()
        subCategory = (item.get('Product Sub Category') or '').strip()
        
        # 5. Set Includes (EXACT FROM SHEET CELL)
        setIncludes = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        
        # 6. Fabric (EXACT FROM SHEET CELL)
        fabric = (item.get('Fabric') or '').strip()
        
        # 7. Wash Care (EXACT FROM SHEET CELL)
        washCare = (item.get('Wash Care') or '').strip()
        
        # 8. Description (EXACT FROM SHEET CELL)
        description = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        
        # 9. Price & MRP (EXACT FROM SHEET CELL)
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
            
        # 10. Disclaimer & Shipping Details (EXACT FROM SHEET CELL)
        disclaimer = (item.get('Disclaimer') or '').strip()
        shippingDetails = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip()
        
        # 11. Stock & Active (EXACT FROM SHEET CELL)
        stock = (item.get('Stock') or '').strip()
        active_str = str(item.get('Active(Yes/No)') or 'Yes').strip().lower()
        active = active_str != 'no'
        
        # 12. Images
        images = existing_images_by_sku.get(sku.lower()) or [f"/images/products/{slug}-1.webp"]
        
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
        exact_products.append(product)

# Fix any duplicate slugs
seen_slugs = {}
for p in exact_products:
    s = p['slug']
    if s in seen_slugs:
        seen_slugs[s] += 1
        p['slug'] = f"{s}-{seen_slugs[s]}"
        p['id'] = p['slug']
    else:
        seen_slugs[s] = 1

print(f"Enforced 100% raw cell data across all {len(exact_products)} products.")

# Save to both JSON files
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_products, f, indent=2, ensure_ascii=False)

print("Saved clean 100% exact products.json files successfully!")

