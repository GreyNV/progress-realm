import os
import json


def test_character_ui_mentions_equipment():
    path = os.path.join('js', 'ui', 'character.js')
    with open(path) as f:
        text = f.read()
    assert 'Lang.ui' in text
    assert 'inventory:changed' in text
    assert 'equipment:changed' in text
    assert 'Equipment' in text


def test_character_translation_has_equipment():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Equipment' in ui
