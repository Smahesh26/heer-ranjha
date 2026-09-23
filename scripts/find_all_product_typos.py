import json, re

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

typo_map = {
    r'\bbottel\b': 'bottle',
    r'\bcelebartions\b': 'celebrations',
    r'\bcraeting\b': 'creating',
    r'\bcraftmanship\b': 'craftsmanship',
    r'\bmaster piece\b': 'masterpiece',
    r'\bdimesnsion\b': 'dimension',
    r'\belelgance\b': 'elegance',
    r'\bembroidred\b': 'embroidered',
    r'\bEmroidered\b': 'Embroidered',
    r'\bemroidered\b': 'embroidered',
    r'\bemroidery\b': 'embroidery',
    r'\bgreybandhgala\b': 'grey bandhgala',
    r'\binitimate\b': 'intimate',
    r'\bintrictae\b': 'intricate',
    r'\bivroy\b': 'ivory',
    r'\bIvroy\b': 'Ivory',
    r'\bmettallic\b': 'metallic',
    r'\bmotis\b': 'motifs',
    r'\bnbroidery\b': 'embroidery',
    r'\boccassions\b': 'occasions',
    r'\bpalyful\b': 'playful',
    r'\bShewani\b': 'Sherwani',
    r'\bshewani\b': 'sherwani',
    r'\bslseeves\b': 'sleeves',
    r'\bstuctured\b': 'structured',
    r'\btraditonal\b': 'traditional',
    r'\bvelevt\b': 'velvet',
    r'\bvertcial\b': 'vertical',
    r'\bweding\b': 'wedding',
    r'\bbloues\b': 'blouse',
    r'\bBloues\b': 'Blouse',
    r'\bembroided\b': 'embroidered',
}

found = []
for p in products:
    for k in ['name', 'subCategory', 'setIncludes', 'fabric', 'washCare', 'description', 'disclaimer', 'shippingDetails']:
        val = str(p.get(k) or '')
        for pat, rep in typo_map.items():
            if re.search(pat, val):
                found.append((p['id'], p['name'], k, pat, rep, val))

print(f"Total typo occurrences found in products.json: {len(found)}")
for item in found:
    print(f"Product [{item[0]}]: Field '{item[2]}' has '{item[3]}' -> '{item[4]}'")
