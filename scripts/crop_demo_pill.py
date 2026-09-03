import sys
from PIL import Image

src_path = 'docs/assets/screenshots/01-catalog.png'
dest_path = 'docs/assets/screenshots/07-demo-pill.png'

img = Image.open(src_path)
# Crop around the top-right header area where DEMO MODE pill and System Status button reside (x: 1100 to 1870, y: 30 to 160 on 1920x1080)
width, height = img.size
crop_box = (int(width * 0.58), int(height * 0.04), int(width * 0.98), int(height * 0.18))
cropped = img.crop(crop_box)
cropped.save(dest_path)
print(f"Saved cropped DEMO MODE pill to {dest_path} ({cropped.size[0]}x{cropped.size[1]})")
