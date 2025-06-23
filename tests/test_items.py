import json
import os


def test_item_fields():
    path = os.path.join('data', 'items.json')
    with open(path) as f:
        data = json.load(f)
    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'rarity' in item
        assert 'effectType' in item
        assert 'effectValue' in item
        assert 'maxQuantity' in item
        assert isinstance(item['maxQuantity'], int)
        assert 'image' in item
