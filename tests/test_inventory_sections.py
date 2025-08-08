import os
import json


def test_getitems_includes_type():
    path = os.path.join('js', 'items.js')
    with open(path) as f:
        text = f.read()
    assert 'type: itemData.type' in text


def test_inventory_has_heading_without_equipment():
    path = os.path.join('js', 'ui', 'inventory.js')
    with open(path) as f:
        text = f.read()
    assert 'Lang.ui' in text
    assert 'Consumables' in text
    assert 'Equipment' not in text


def test_index_has_equipment_section():
    path = 'index.html'
    with open(path) as f:
        text = f.read()
    assert 'equipment-items' in text


def test_uk_translation_sections():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Consumables' in ui
