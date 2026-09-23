import json
import re
from collections import Counter

with open('lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Collect all text
all_text = []
for p in products:
    for k in ['name', 'subCategory', 'setIncludes', 'fabric', 'washCare', 'description', 'disclaimer', 'shippingDetails']:
        if p.get(k):
            all_text.append((p['name'], k, str(p[k])))

# Extract all words
words = Counter()
for _, _, text in all_text:
    for w in re.findall(r'[A-Za-z]+', text):
        words[w] += 1

print(f"Total unique words: {len(words)}")

# Look for words that are suspiciously rare or contain known typo patterns
# Let's check for known words with typos
known_typos = {
    'bloues': 'blouse',
    'blouse': 'blouse',
    'velevt': 'velvet',
    'elelgance': 'elegance',
    'craftmanship': 'craftsmanship',
    'Shewani': 'Sherwani',
    'shewani': 'sherwani',
    'emroidered': 'embroidered',
    'embroided': 'embroidered',
    'embroidred': 'embroidered',
    'motis': 'motifs',
    'greybandhgala': 'grey bandhgala',
    'sophicticated': 'sophisticated',
    'occasions': 'occasions',
    'silhouete': 'silhouette',
    'colletion': 'collection',
    'tradional': 'traditional',
    'intricate': 'intricate',
    'intricately': 'intricately',
    'elegence': 'elegance',
    'focussed': 'focused',
    'stuning': 'stunning',
    'embellishements': 'embellishments',
    'detaling': 'detailing',
    'timeles': 'timeless',
    'paisely': 'paisley',
    'palazzo': 'palazzo',
    'sharara': 'sharara',
    'trousers': 'trousers',
    'waistcoat': 'waistcoat',
    'bandhgala': 'bandhgala',
    'sherwani': 'sherwani',
    'chikankari': 'chikankari',
    'georgette': 'georgette',
    'chanderi': 'chanderi',
    'dupion': 'dupion',
    'matka': 'matka',
    'zardozi': 'zardozi',
}

# Print any words occurring only 1-2 times that are not obviously proper nouns
print("\n--- Low frequency words that might be typos ---")
for w, count in words.items():
    wl = w.lower()
    if count <= 3 and len(w) > 4:
        # Check if contains double letters or looks weird
        if any(typo in wl for typo in ['emb', 'vel', 'ele', 'craf', 'sil', 'she', 'mot', 'blou', 'beau', 'exqu', 'soph', 'art']):
            print(f"  {w} ({count})")

