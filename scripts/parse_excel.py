import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re

def col_to_num(col_str):
    num = 0
    for c in col_str:
        num = num * 26 + (ord(c.upper()) - ord('A')) + 1
    return num - 1

def parse_xlsx(filename):
    print(f"Parsing {filename}...", flush=True)
    with zipfile.ZipFile(filename, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            with z.open('xl/sharedStrings.xml') as f:
                for event, elem in ET.iterparse(f):
                    if elem.tag.endswith('si'):
                        texts = [t.text for t in elem.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]
                        shared_strings.append("".join(texts))
                        elem.clear()
        
        rows = []
        with z.open('xl/worksheets/sheet1.xml') as f:
            row_dict = {}
            for event, elem in ET.iterparse(f, events=('start', 'end')):
                if event == 'end' and elem.tag.endswith('row'):
                    if row_dict:
                        max_col = max(row_dict.keys())
                        row_list = [row_dict.get(i, '') for i in range(max_col + 1)]
                        rows.append(row_list)
                    row_dict = {}
                    elem.clear()
                elif event == 'end' and elem.tag.endswith('c'):
                    r_ref = elem.attrib.get('r', '')
                    col_match = re.match(r'([A-Z]+)', r_ref)
                    col_idx = col_to_num(col_match.group(1)) if col_match else len(row_dict)
                    
                    t = elem.attrib.get('t')
                    v = elem.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else ''
                    
                    if t == 's' and val != '':
                        val = shared_strings[int(val)] if int(val) < len(shared_strings) else ''
                    elif t == 'str':
                        val = val
                    row_dict[col_idx] = val
        return rows

files = {
    'asaya': r'new/Collection- Asaya Corrected Sheet.xlsx',
    'nayi': r'new/NAYI LEHER Corrected sheet for WEBSITE (Autosaved).xlsx',
    'roomani': r'new/Roomani collection detailed sheet (Autosaved).xlsx'
}

data = {}
for k, f in files.items():
    data[k] = parse_xlsx(f)
    print(f"Loaded {k}: {len(data[k])} rows", flush=True)

def to_dict_list(rows):
    header_idx = -1
    for i, r in enumerate(rows[:10]):
        row_str = " ".join([str(x).lower() for x in r])
        if 'sku' in row_str or 'product name' in row_str:
            header_idx = i
            break
    if header_idx == -1:
        return []
    
    headers = [str(x).strip() for x in rows[header_idx]]
    result = []
    for r in rows[header_idx+1:]:
        item = {}
        for idx, h in enumerate(headers):
            if h:
                item[h] = str(r[idx]).strip() if idx < len(r) else ''
        if any(item.values()):
            result.append(item)
    return result

parsed_sheets = {k: to_dict_list(v) for k, v in data.items()}

for k, items in parsed_sheets.items():
    print(f"\n=================== {k.upper()} ({len(items)} items) ===================", flush=True)
    for idx, item in enumerate(items):
        sku = item.get('SKU') or item.get('Style Code') or item.get('COLLECTION 2nd') or ''
        name = item.get('Product Name') or item.get('Product Name ') or ''
        category = item.get('Product Category') or ''
        subcat = item.get('Product Sub Category') or ''
        set_inc = item.get('Set Includes') or item.get('Set includes') or ''
        coll = item.get('Collection') or ''
        color = item.get('Color') or item.get('Colour') or ''
        desc = item.get('Product Highlights (Description)') or item.get('Description') or ''
        print(f"Row {idx+1}: SKU='{sku}' | Name='{name}' | Cat='{category}' | Sub='{subcat}' | SetInc='{set_inc}' | Coll='{coll}'", flush=True)
        if 'yellow' in (name+desc+color+sku).lower() or 'mustard' in (name+desc+color+sku).lower():
            print(f"   *** YELLOW MATCH: {name} (Color: {color}, Desc: {desc[:60]}...)", flush=True)

with open('scratch/parsed_sheets.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_sheets, f, indent=2, ensure_ascii=False)
print("Saved scratch/parsed_sheets.json", flush=True)

