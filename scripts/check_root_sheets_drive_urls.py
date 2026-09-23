import zipfile
import json
import re
import html

def parse_xlsx_fast(filename):
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

asaya_old = parse_xlsx_fast('Collection- Asaya Detailed Sheet.xlsx')
nayi_old = parse_xlsx_fast('NAYI LEHER Corrected sheet for WEBSITE.xlsx')

print(f"Old Asaya rows: {len(asaya_old)}")
print(f"Old Nayi rows: {len(nayi_old)}")

asaya_urls = 0
for r in asaya_old:
    row_str = " ".join(r.values())
    urls = re.findall(r'https://drive\.google\.com[^\s",]+', row_str)
    if urls:
        asaya_urls += 1

nayi_urls = 0
for r in nayi_old:
    row_str = " ".join(r.values())
    urls = re.findall(r'https://drive\.google\.com[^\s",]+', row_str)
    if urls:
        nayi_urls += 1

print(f"Old Asaya rows with Drive URLs: {asaya_urls} / {len(asaya_old)}")
print(f"Old Nayi rows with Drive URLs: {nayi_urls} / {len(nayi_old)}")

