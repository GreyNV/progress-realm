import json
import os
import re
from typing import List, Dict

import requests

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

ACTIONS_PATH = os.path.join('data', 'actions.json')
IMAGES_DIR = os.path.join('assets', 'generated')


def load_actions() -> List[Dict]:
    """Load actions from the JSON file."""
    with open(ACTIONS_PATH, 'r', encoding='utf-8') as f:
        actions = json.load(f)
    for action in actions:
        if 'image' not in action:
            action['image'] = None
    return actions


def generate_prompt(action: Dict) -> str:
    """Create an image prompt for an action."""
    name = action.get('name', 'Unknown Action')
    prompt = (
        "Generate a single image in photorealistic style representing the "
        "activity for a medieval reincarnation game-novel. "
        f"The action is {name}."
    )
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


def update_image_field(action: Dict, path: str) -> None:
    """Update the action dict with the new image path."""
    action['image'] = path


def save_actions(actions: List[Dict]) -> None:
    """Write the updated actions back to the JSON file."""
    with open(ACTIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(actions, f, indent=2)


def main() -> None:
    actions = load_actions()
    for action in actions:
        img_field = action.get('image')
        if not img_field or not os.path.isfile(img_field):
            prompt = generate_prompt(action)
            url = generate_image(prompt)
            path = save_image(url, action['name'])
            update_image_field(action, path)
    save_actions(actions)


if __name__ == '__main__':
    main()
