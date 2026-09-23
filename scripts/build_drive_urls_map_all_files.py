import zipfile
import json
import re
import html
import glob
import os

def parse_xlsx_fast(filename):
    if not os.path.exists(filename): return []
    with zipfile.ZipFile(filename, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_content = z.read('xl/sharedStrings.xml').decode('utf-8', errors='ignore')
            si_blocks = re.findall(r'<si>(.*?)</si>', ss_content, re.DOTALL)
            for si in si_blocks:
                t_texts = re.findall(r'<t[^>]*>(.*?)</t>', si, re.DOTALL)
                shared_strings.append(html.unescape("".join(t_texts)))
        
        sheet_content = z.read('xl/worksheets/sheet1.xml').decode('utf-8', errors='ignore')
        row_blocks = re.findall(r'<row r="(\d+)"[^>]*>(.*?)</row>', sheet_content, re.DOTALL)
        
        rows = []
        for r_num, r_inner in row_blocks:
            c_cells = re.findall(r'<c r="([A-Z]+)(\d+)"([^>]*)>(.*?)</c>', r_inner, re.DOTALL)
            row_dict = {}
            for col_str, r_idx, c_attr, c_val in c_cells:
                t_match = re.search(r't="([^"]+)"', c_attr)
                t_type = t_match.group(1) if t_match else None
                v_match = re.search(r'<v>(.*?)</v>', c_val, re.DOTALL)
                val = v_match.group(1) if v_match else ''
                if t_type == 's' and val.isdigit():
                    s_idx = int(val)
                    val = shared_strings[s_idx] if s_idx < len(shared_strings) else ''
                row_dict[col_str] = val.strip()
            rows.append(row_dict)
        return rows

excel_files = [f for f in glob.glob('*.xlsx') + glob.glob('new/*.xlsx') if not os.path.basename(f).startswith('~$')]
print("Found Excel files:", excel_files)

all_drive_mappings = {}

for f in excel_files:
    if f.startswith('~$'): continue
    rows = parse_xlsx_fast(f)
    print(f"\nAnalyzing {f} ({len(rows)} rows)...")
    
    for r in rows:
        r_text = " ".join(r.values())
        urls = re.findall(r'https://drive\.google\.com[^\s",\)]+', r_text)
        sku = r.get('B') or r.get('A') or ''
        name = r.get('C') or r.get('B') or ''
        
        if urls:
            if sku: all_drive_mappings[sku.lower()] = urls
            if name: all_drive_mappings[name.lower()] = urls
            # Also extract keywords from row
            for val in r.values():
                if len(val) > 4 and ('kurta' in val.lower() or 'skirt' in val.lower() or 'dress' in val.lower() or 'waistcoat' in val.lower() or 'jacket' in val.lower() or 'set' in val.lower()):
                    all_drive_mappings[val.lower()] = urls

print(f"\nTotal Drive mappings compiled: {len(all_drive_mappings)}")

with open('components/shop/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    name_k = p['name'].lower()
    sku_k = (p.get('sku') or '').lower()
    
    urls = all_drive_mappings.get(sku_k) or all_drive_mappings.get(name_k)
    if urls:
        print(f"Product [{p.get('sku')}] '{p['name']}' HAS {len(urls)} Drive URLs -> {urls[0]}")
    else:
        # try partial match
        part_urls = None
        for k, u_list in all_drive_mappings.items():
            if len(k) > 6 and (k in name_k or name_k in k):
                part_urls = u_list
                break
        if part_urls:
            print(f"Product [{p.get('sku')}] '{p['name']}' PARTIAL MATCH {len(part_urls)} Drive URLs -> {part_urls[0]}")
        else:
            print(f"Product [{p.get('sku')}] '{p['name']}' NO DRIVE URLS FOUND!")

