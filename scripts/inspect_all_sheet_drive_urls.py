import json
import re

with open('scratch/parsed_sheets.json', 'r', encoding='utf-8') as f:
    sheets = json.load(f)

print("=== CHECKING GOOGLE DRIVE URLS IN ALL 3 EXCEL SHEETS ===")

total_products = 0
products_with_urls = 0

for sheet_key, items in sheets.items():
    print(f"\n--- Sheet: {sheet_key.upper()} ({len(items)} items) ---")
    sheet_urls_count = 0
    for idx, item in enumerate(items):
        total_products += 1
        sku = (item.get('SKU') or item.get('Style Code') or item.get('Item SKU') or '').strip()
        name = (item.get('Product Name') or item.get('Product Name ') or '').strip()
        urls_str = item.get('Image URLs (comma separated)') or item.get('Image URLs (comma separated') or ''
        urls = [u.strip() for u in urls_str.split(',') if u.strip()]
        
        if urls:
            sheet_urls_count += 1
            products_with_urls += 1
            if 'lilac' in name.lower() or 'light grey' in name.lower() or idx < 3:
                print(f"Row {idx+1} [{sku}] '{name}': {len(urls)} Drive URLs -> {urls[0]}")
                
    print(f"Total in {sheet_key.upper()} with Drive URLs: {sheet_urls_count} / {len(items)}")

print(f"\nOVERALL TOTAL WITH DRIVE URLS: {products_with_urls} / {total_products}")

