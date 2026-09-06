# -*- coding: utf-8 -*-
"""
壓縮文章圖片（原檔備份到 posts/_original/）。

作法：
  - 長邊縮到 1600px（部落格版面最寬約 800px，2 倍供高 DPI 螢幕使用）
  - JPEG 品質 82、開啟 progressive
  - PNG 若無透明度則轉存為 JPEG，有透明度則以 optimize 重存
  - 自動去除 EXIF（順便移除相機/位置資訊）

    python compress_images.py            # 實際壓縮
    python compress_images.py --dry-run  # 只看會變多小，不動檔案
"""
import os
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
TARGETS = ["posts/2026-hitcon", "posts/2026-旺宏科學獎"]
BACKUP = os.path.join(ROOT, "posts", "_original")

MAX_EDGE = 1600
JPEG_QUALITY = 82
DRY = "--dry-run" in sys.argv


def human(n):
    return f"{n/1024/1024:.2f} MB" if n >= 1024 * 1024 else f"{n/1024:.0f} KB"


def has_alpha(im):
    return im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)


def main():
    total_before = total_after = 0
    rows = []

    for rel in TARGETS:
        d = os.path.join(ROOT, rel)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            src = os.path.join(d, name)
            before = os.path.getsize(src)

            im = Image.open(src)
            w, h = im.size
            # 依長邊等比例縮小
            if max(w, h) > MAX_EDGE:
                scale = MAX_EDGE / max(w, h)
                im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

            keep_png = name.lower().endswith(".png") and has_alpha(im)
            if keep_png:
                out_path, params = src, dict(optimize=True)
                if im.mode == "P":
                    im = im.convert("RGBA")
            else:
                # 無透明度一律存成 JPEG（副檔名維持原樣，瀏覽器看內容判斷）
                out_path = src
                im = im.convert("RGB")
                params = dict(format="JPEG", quality=JPEG_QUALITY,
                              optimize=True, progressive=True)

            if DRY:
                import io as _io
                buf = _io.BytesIO()
                im.save(buf, **({} if keep_png else params)) if not keep_png else \
                    im.save(buf, format="PNG", **params)
                after = buf.tell()
            else:
                if not os.path.exists(os.path.join(BACKUP, os.path.basename(rel), name)):
                    bdir = os.path.join(BACKUP, os.path.basename(rel))
                    os.makedirs(bdir, exist_ok=True)
                    shutil.copy2(src, os.path.join(bdir, name))
                if keep_png:
                    im.save(out_path, format="PNG", **params)
                else:
                    im.save(out_path, **params)
                after = os.path.getsize(out_path)

            total_before += before
            total_after += after
            rows.append((rel, name, before, after, f"{w}x{h}", f"{im.size[0]}x{im.size[1]}"))

    print(f"{'檔案':42}{'原始':>10}{'壓縮後':>10}{'縮減':>8}   尺寸")
    print("-" * 92)
    for rel, name, b, a, s0, s1 in rows:
        print(f"{name[:40]:42}{human(b):>10}{human(a):>10}"
              f"{(1-a/b)*100:>7.0f}%   {s0} → {s1}")
    print("-" * 92)
    print(f"{'合計':42}{human(total_before):>10}{human(total_after):>10}"
          f"{(1-total_after/total_before)*100:>7.0f}%")
    if DRY:
        print("\n(--dry-run 模式，未修改任何檔案)")
    else:
        print(f"\n原檔已備份至 {BACKUP}")


if __name__ == "__main__":
    main()
