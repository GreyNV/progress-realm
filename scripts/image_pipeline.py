import json
import os
import re
from typing import List, Dict

import logging

import requests

try:
    from openai import OpenAI
except ImportError:  # openai might not be installed
    OpenAI = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


ITEMS_PATH = os.path.join('data', 'items.json')
IMAGES_DIR = os.path.join('assets', 'generated')


def load_items() -> List[Dict]:
    """Load items from the JSON file."""
    with open(ITEMS_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)
    for item in items:
        if 'image' not in item:
            item['image'] = None
    return items


def generate_prompt(item: Dict) -> str:
    """Generate an image prompt for an item."""
    name = item.get('name', 'Unknown Item')
    description = item.get('description', '')
    base_prompt = f"Generate image in photorealistic style based on the item and setting."
    base_prompt +=  f"The setting is medieval times reincarnation game-novel. Item is on the wooden table and from the close-up and from above "
    base_prompt +=  f"(suitable for display in inventory). The target item is {name}"
    if description:
        base_prompt += f". Some item background: {description}"
    base_prompt += ""
    logger.debug("Prompt: %s", base_prompt)
    return base_prompt


def generate_image(prompt: str) -> str:
    """Generate an image using OpenAI's API and return the image URL."""
    if OpenAI is None:
        raise RuntimeError("openai package is not installed")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set")

    client = OpenAI(api_key=api_key)
    logger.info("Requesting image from OpenAI")
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size="1024x1024",
        style="natural"
    )
    return response.data[0].url


def save_image(url: str, item_name: str) -> str:
    """Download an image and save it locally."""
    if not os.path.isdir(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)
    sanitized = re.sub(r'[^a-z0-9]+', '_', item_name.lower()).strip('_')
    path = os.path.join(IMAGES_DIR, f"{sanitized}.png")
    logger.debug("Downloading %s", url)
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    with open(path, 'wb') as f:
        f.write(response.content)
    logger.info("Saved image to %s", path)
    return path


def update_item_image(item: Dict, path: str) -> None:
    """Update the image path in an item dict."""
    item['image'] = path


def save_items(items: List[Dict]) -> None:
    """Write the updated items back to the JSON file."""
    with open(ITEMS_PATH, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2)


def main() -> None:
    logger.info("Loading items from %s", ITEMS_PATH)
    items = load_items()
    for item in items:
        img_field = item.get('image')
        if not img_field or not os.path.isfile(img_field):
            prompt = generate_prompt(item)
            url = generate_image(prompt)
            path = save_image(url, item['name'])
            update_item_image(item, path)
    save_items(items)
    logger.info("Updated %d items", len(items))


if __name__ == '__main__':
    main()
