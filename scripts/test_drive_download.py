import urllib.request
import re
import os

def download_drive_image(drive_url, dest_path):
    m = re.search(r'/d/([a-zA-Z0-9_-]+)', drive_url)
    if not m:
        print("Invalid drive URL:", drive_url)
        return False
    file_id = m.group(1)
    
    # Try direct googleusercontent URL first
    dl_urls = [
        f"https://lh3.googleusercontent.com/d/{file_id}",
        f"https://drive.google.com/uc?export=download&id={file_id}"
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    for url in dl_urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if len(data) > 2000 and not data.startswith(b'<!DOCTYPE html>'):
                    with open(dest_path, 'wb') as f:
                        f.write(data)
                    print(f"✓ Downloaded {os.path.basename(dest_path)} ({len(data)} bytes) from {url}")
                    return True
        except Exception as e:
            pass
            
    print(f"✗ Failed to download {drive_url}")
    return False

# Test download for Lilac Halterneck Dress
download_drive_image('https://drive.google.com/file/d/1kw0bknL9PtLfbumBnzDatAnbGV_sxC6y/view?usp=sharing', 'scratch/lilac_dress_test.jpg')
download_drive_image('https://drive.google.com/file/d/1GnD9a4psr4clJ0n1w8jT4ewPgbCfkm3e/view?usp=sharing', 'scratch/light_grey_skirt_test.jpg')
