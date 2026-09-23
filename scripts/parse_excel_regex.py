import zipfile
import json
import re
import html
import os

def col_to_num(col_str):
    num = 0
    for c in col_str:
        num = num * 26 + (ord(c.upper()) - ord('A')) + 1
    return num - 1

def parse_xlsx_fast(filename):
    print(f"Fast parsing {filename}...", flush=True)
    with zipfile.ZipFile(filename, 'r') as z:
        # Load shared strings using regex
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_content = z.read('xl/sharedStrings.xml').decode('utf-8', errors='ignore')
            # Extract each <si> block
            si_blocks = re.findall(r'<si>(.*?)</si>', ss_content, re.DOTALL)
            for si in si_blocks:
                t_texts = re.findall(r'<t[^>]*>(.*?)</t>', si, re.DOTALL)
                text = "".join(t_texts)
                shared_strings.append(html.unescape(text))
        
        # Read sheet1.xml
        sheet_content = z.read('xl/worksheets/sheet1.xml').decode('utf-8', errors='ignore')
        row_blocks = re.findall(r'<row r="(\d+)"[^>]*>(.*?)</row>', sheet_content, re.DOTALL)
        
        rows = []
        for r_num, r_inner in row_blocks:
            c_cells = re.findall(r'<c r="([A-Z]+)(\d+)"([^>]*)>(.*?)</c>', r_inner, re.DOTALL)
            row_dict = {}
            for col_str, r_idx, c_attr, c_val in c_cells:
                c_col_idx = col_to_num(col_str)
                # check cell type
                t_match = re.search(r't="([^"]+)"', c_attr)
                t_type = t_match.group(1) if t_match else None
                
                v_match = re.search(r'<v>(.*?)</v>', c_val, re.DOTALL)
                val = v_match.group(1) if v_match else ''
                
                if t_type == 's' and val.isdigit():
                    s_idx = int(val)
                    val = shared_strings[s_idx] if s_idx < len(shared_strings) else ''
                elif t_type == 'inlineStr':
                    t_in = re.search(r'<t[^>]*>(.*?)</t>', c_val, re.DOTALL)
                    val = html.unescape(t_in.group(1)) if t_in else ''
                else:
                    val = html.unescape(val)
                row_dict[c_col_idx] = val.strip()
            
            if row_dict:
                max_col = max(row_dict.keys())
                row_list = [row_dict.get(i, '') for i in range(max_col + 1)]
                rows.append(row_list)
        return rows

files = {
    'asaya': r'new/Collection- Asaya Corrected Sheet.xlsx',
    'nayi': r'new/NAYI LEHER Corrected sheet for WEBSITE (Autosaved).xlsx',
    'roomani': r'new/Roomani collection detailed sheet (Autosaved).xlsx'
}

data = {}
for k, f in files.items():
    data[k] = parse_xlsx_fast(f)
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

os.makedirs('scratch', exist_ok=True)
with open('scratch/parsed_sheets.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_sheets, f, indent=2, ensure_ascii=False)
print("\nSaved scratch/parsed_sheets.json successfully!", flush=True)

