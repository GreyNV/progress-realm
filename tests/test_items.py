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
        assert 'type' in item
        if item['type'] == 'food':
            assert 'restore' in item
            assert isinstance(item['restore'], dict)
            assert 'health' in item['restore']
        else:
            assert 'restore' not in item or item['restore'] == {}
        assert 'image' in item

def test_food_restoration_values():
    path = os.path.join('data', 'items.json')
    with open(path) as f:
        data = json.load(f)
    rabbit = next(i for i in data if i['id'] == 'rabbit_meat')
    assert rabbit['restore']['health'] > 1
    berries = next(i for i in data if i['id'] == 'berries')
    assert set(berries['restore'].keys()) == {'health', 'energy', 'focus'}
