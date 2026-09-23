import os
import json

img_dir = 'public/images/products'
files = os.listdir(img_dir) if os.path.exists(img_dir) else []

print("=== ALL BLACK IMAGES IN PUBLIC/IMAGES/PRODUCTS ===")
black_files = [f for f in files if 'black' in f.lower()]
for f in sorted(black_files):
    print(" -", f)

print("\n=== CHECKING ORIGINAL ASAYA SHEET OR OTHER SCRIPTS FOR HKP-234-BLACK ===")

# Check if there are other excel sheets in root or scripts with drive URLs
import glob
for x in glob.glob("*.xlsx") + glob.glob("new/*.xlsx"):
    print("Excel file:", x)

