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
        assert isinstance(item['effectValue'], dict)
        assert 'image' in item


def test_effect_formula_log():
    path = os.path.join('data', 'items.json')
    with open(path) as f:
        data = json.load(f)
    herb = next(i for i in data if i['id'] == 'herb')
    qty = 1
    effect_val = herb['effectValue']['focus']
    import math
    effect = effect_val * math.log(qty + 1)
    assert effect > 0
