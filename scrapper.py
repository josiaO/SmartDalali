import os
import asyncio
import aiohttp
import aiofiles
import requests
from bs4 import BeautifulSoup

TARGET_URLS = [
    "https://unsplash.com/s/photos/house",
    "https://unsplash.com/t/people"
]

SAVE_DIR = "unsplash_images"
MAX_IMAGES = 40


def scrape_image_urls():
    print("[*] Scraping image URLs...")
    image_urls = []

    for url in TARGET_URLS:
        print(f"[*] Scraping: {url}")
        html = requests.get(url).text
        soup = BeautifulSoup(html, "html.parser")

        for img in soup.find_all("img"):
            src = img.get("src")
            if src and "images.unsplash.com" in src:
                image_urls.append(src)

            if len(image_urls) >= MAX_IMAGES:
                break

        if len(image_urls) >= MAX_IMAGES:
            break

    print(f"[✓] Total images found: {len(image_urls)}")
    return image_urls


async def download_image(session, url, index):
    try:
        async with session.get(url) as res:
            if res.status != 200:
                print(f"[X] Failed {url}")
                return

            content = await res.read()
            filename = os.path.join(SAVE_DIR, f"img_{index+1}.jpg")

            async with aiofiles.open(filename, "wb") as f:
                await f.write(content)

            print(f"[✓] Downloaded: {filename}")

    except Exception as e:
        print(f"[X] Error {url}: {e}")


async def download_all(urls):
    os.makedirs(SAVE_DIR, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        tasks = [
            download_image(session, url, i)
            for i, url in enumerate(urls)
        ]
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    image_urls = scrape_image_urls()
    asyncio.run(download_all(image_urls))
