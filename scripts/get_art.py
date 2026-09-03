import urllib.request
import hashlib
import os

images = [
    {
        "name": "sintel.jpg",
        "url": "https://archive.org/download/Sintel/sintel-poster.jpg"
    },
    {
        "name": "big_buck_bunny.jpg",
        "url": "https://archive.org/download/BigBuckBunny_328/big_buck_bunny_poster.jpg"
    },
    {
        "name": "elephants_dream.jpg",
        "url": "https://archive.org/download/ElephantsDream/elephants_dream_poster.jpg"
    }
]

dest_dir = os.path.join(os.path.dirname(__file__), "..", "apps", "firetv", "assets", "art")
os.makedirs(dest_dir, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

for item in images:
    target = os.path.join(dest_dir, item["name"])
    print(f"Fetching {item['name']} from {item['url']}...")
    req = urllib.request.Request(item["url"], headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            with open(target, "wb") as f:
                f.write(data)
            h = hashlib.sha256(data).hexdigest()
            print(f"Saved {item['name']}: {len(data)} bytes, SHA256: {h}")
    except Exception as e:
        print(f"Failed {item['name']}: {e}")
