"""
pack_web_assets.py
Safely packages and gzip-compresses web_assets/index.html to web_assets/index.html.gz
with validation to ensure no tags, URLs, or scripts are truncated or corrupted.
"""
import gzip
import os
import sys

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    src_file = os.path.join(root, "web_assets", "index.html")
    dst_file = os.path.join(root, "web_assets", "index.html.gz")

    with open(src_file, "rb") as f:
        raw_data = f.read()

    text = raw_data.decode("utf-8")

    # Strict validations
    assert "pwaLaunchBtn" in text, "Missing pwaLaunchBtn ID!"
    assert '<a id="pwaLaunchBtn"' in text, "Missing <a id=\"pwaLaunchBtn\" tag!"
    assert 'https://398epd.zgqinc.gq/' in text, "Missing PWA studio URL!"
    assert text.count("<a ") == text.count("</a>"), f"Mismatched <a> count: {text.count('<a ')} vs {text.count('</a>')}"
    assert "href=\"https:\n" not in text, "Corrupted https prefix found!"

    # Gzip compress at highest level with reproducible timestamp
    gz_data = gzip.compress(raw_data, compresslevel=9, mtime=0)

    with open(dst_file, "wb") as f:
        f.write(gz_data)

    # Verification
    decompressed = gzip.decompress(open(dst_file, "rb").read())
    assert decompressed == raw_data, "Decompressed payload does not match source!"

    print(f"[OK] Successfully packed {src_file} ({len(raw_data)} bytes) -> {dst_file} ({len(gz_data)} bytes)")

if __name__ == "__main__":
    main()
