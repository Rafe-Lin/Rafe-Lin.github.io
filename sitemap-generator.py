"""從 posts.json 產生 sitemap.xml。

用法： python sitemap-generator.py
"""
import json
import xml.etree.ElementTree as ET
from datetime import date, datetime
from urllib.parse import quote

# 網站根目錄（結尾不要有 "/"，下面的 link 都以 "/" 開頭）
DOMAIN = "https://rafe-lin.github.io"

# 固定頁面（非文章）
STATIC_PAGES = [
    {"link": "/",               "changefreq": "weekly",  "priority": "1.0"},
    {"link": "/?page=posts",    "changefreq": "weekly",  "priority": "0.8"},
    {"link": "/?page=CV",       "changefreq": "monthly", "priority": "0.8"},
    {"link": "/?page=timeline", "changefreq": "monthly", "priority": "0.8"},
]


def parse_date(text):
    """posts.json 的日期可能寫成 2026-9-5 或 2026-09-05，兩種都要吃。"""
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"無法解析日期：{text!r}")


def build_loc(link):
    """把 posts.json 的 link 轉成完整網址；中文與空白要做 percent-encoding。"""
    # 安全字元保留 query string 用得到的符號
    return DOMAIN + quote(link, safe="/?=&-_.~")


def add_url(urlset, loc, lastmod, changefreq, priority):
    url = ET.SubElement(urlset, "url")
    ET.SubElement(url, "loc").text = loc
    ET.SubElement(url, "lastmod").text = lastmod
    ET.SubElement(url, "changefreq").text = changefreq
    ET.SubElement(url, "priority").text = priority


def main():
    with open("posts.json", "r", encoding="utf-8") as f:
        posts = json.load(f)

    # 只收站內文章：外部連結（AIS3 那筆指向 bing）不屬於本站，放進去會變成
    # https://rafe-lin.github.io/https://www.bing.com/... 這種壞網址
    internal, external = [], []
    for post in posts:
        (external if post["link"].startswith(("http://", "https://")) else internal).append(post)

    dates = [parse_date(p["date"]) for p in internal]
    newest = max(dates).isoformat() if dates else date.today().isoformat()

    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for page in STATIC_PAGES:
        add_url(urlset, build_loc(page["link"]), newest, page["changefreq"], page["priority"])

    for post, d in zip(internal, dates):
        add_url(urlset, build_loc(post["link"]), d.isoformat(), "monthly", "0.8")

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    tree.write("sitemap.xml", encoding="utf-8", xml_declaration=True)

    print(f"sitemap.xml 生成完成：{len(STATIC_PAGES)} 個固定頁 + {len(internal)} 篇文章")
    for post in external:
        print(f"  （略過外部連結）{post['title']} -> {post['link'][:60]}...")


if __name__ == "__main__":
    main()
