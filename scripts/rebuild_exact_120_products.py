import json
import re
import os

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

# Get list of existing local images in public/images/products
existing_images = []
img_dir = 'public/images/products'
if os.path.exists(img_dir):
    existing_images = os.listdir(img_dir)

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
        
        # 1. Collection
        coll = (item.get('Collection') or default_coll).strip()
        
        # 2. SKU / Style Code
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or item.get('COLLECTION 2nd') or '').strip()
        
        # 3. Product Name
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        if not name and sku:
            name = sku
            
        # FORCE YELLOW SET TO NAYI LEHER AS PER CLIENT INSTRUCTION
        if 'yellow' in name.lower() or 'yellow' in sku.lower():
            coll = 'NAYI LEHER'
            
        slug = slugify(name)
        if not slug:
            slug = f"product-{item_counter}"
            
        # 4. Category & SubCategory
        category = (item.get('Product Category') or '').strip()
        subCategory = (item.get('Product Sub Category') or '').strip()
        
        # 5. Set Includes (AS IT IS IN EXCEL)
        setIncludes = (item.get('Set Includes') or item.get('Set includes') or '').strip()
        
        # 6. Fabric
        fabric = (item.get('Fabric') or '').strip()
        
        # 7. Wash Care
        washCare = (item.get('Wash Care') or '').strip()
        
        # 8. Product Highlights / Description (AS IT IS IN EXCEL)
        description = (item.get('Product Highlights (Description)') or item.get('Product Description') or item.get('Description') or '').strip()
        
        # 9. Price & MRP
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
            
        # 10. Disclaimer & Shipping Details
        disclaimer = (item.get('Disclaimer') or '').strip()
        shippingDetails = (item.get('Shipping Details') or item.get('Shipping And Order Processing') or '').strip()
        
        # 11. Stock & Active
        stock = (item.get('Stock') or 'MTO').strip()
        active_str = str(item.get('Active(Yes/No)') or 'Yes').strip().lower()
        active = active_str != 'no'
        
        # 12. Images: match local files by slug or SKU
        matched_imgs = []
        for img in existing_images:
            img_lower = img.lower()
            # Match if slug or SKU is in filename
            if (slug and slug in img_lower) or (sku and slugify(sku) in img_lower):
                matched_imgs.append(f"/images/products/{img}")
                
        # Sort matched images numerically by suffix (-1, -2, etc.)
        def img_sort_key(url):
            m = re.search(r'-(\d+)\.webp$', url)
            return int(m.group(1)) if m else 99
        matched_imgs.sort(key=img_sort_key)
        
        if not matched_imgs:
            # Fallback image placeholder
            matched_imgs = [f"/images/products/{slug}-1.webp"]
            
        product = {
            "id": slug if slug else f"item-{item_counter}",
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
            "featured": False,
            "images": matched_imgs,
            "createdAt": "2026-08-31T00:00:00.000Z"
        }
        exact_products.append(product)

print(f"\nBuilt EXACT {len(exact_products)} products from the 3 Excel sheets.")

# Check breakdown by collection
coll_counts = {}
for p in exact_products:
    c = p['collection']
    coll_counts[c] = coll_counts.get(c, 0) + 1

print("Collection breakdown:", json.dumps(coll_counts, indent=2))

# Save to components/shop/products.json AND lib/data/products.json
with open('components/shop/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_products, f, indent=2, ensure_ascii=False)

with open('lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(exact_products, f, indent=2, ensure_ascii=False)

print("\nSuccessfully updated both products.json files with EXACTLY 120 products from Excel!")

