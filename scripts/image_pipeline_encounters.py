import json
import os
import re
from typing import List, Dict

import requests

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

ENCOUNTERS_PATH = os.path.join('data', 'encounters.json')
IMAGES_DIR = os.path.join('assets', 'generated')


def load_encounters() -> List[Dict]:
    """Load encounters from the JSON file."""
    with open(ENCOUNTERS_PATH, 'r', encoding='utf-8') as f:
        encounters = json.load(f)
    for encounter in encounters:
        if 'image' not in encounter:
            encounter['image'] = None
    return encounters


def generate_prompt(encounter: Dict) -> str:
    """Create an image prompt for an encounter."""
    name = encounter.get('name', 'Unknown Encounter')
    description = encounter.get('description', '')
    prompt = (
        "Generate a single image in photorealistic style representing the "
        "encounter for a medieval reincarnation game-novel. "
        f"The encounter is {name}."
    )
    if description:
        prompt += f" {description}"
    return prompt


def generate_image(prompt: str) -> str:
    """Generate an image using OpenAI's API and return its URL."""
    if OpenAI is None:
        raise RuntimeError("openai package is not installed")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set")

    client = OpenAI(api_key=api_key)
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size="1024x1024",
        style="natural",
    )
    return response.data[0].url


def save_image(url: str, name: str) -> str:
    """Download an image and save it locally."""
    if not os.path.isdir(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)
    sanitized = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    path = os.path.join(IMAGES_DIR, f"{sanitized}.png")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    with open(path, 'wb') as f:
        f.write(response.content)
    return path


def update_image_field(encounter: Dict, path: str) -> None:
    """Update the encounter dict with the new image path."""
    encounter['image'] = path


def save_encounters(encounters: List[Dict]) -> None:
    """Write the updated encounters back to the JSON file."""
    with open(ENCOUNTERS_PATH, 'w', encoding='utf-8') as f:
        json.dump(encounters, f, indent=2)


def main() -> None:
    encounters = load_encounters()
    for encounter in encounters:
        img_field = encounter.get('image')
        if not img_field or not os.path.isfile(img_field):
            prompt = generate_prompt(encounter)
            url = generate_image(prompt)
            path = save_image(url, encounter['name'])
            update_image_field(encounter, path)
    save_encounters(encounters)


if __name__ == '__main__':
    main()
