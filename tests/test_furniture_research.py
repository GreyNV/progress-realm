import json
import os


def test_furniture_fields():
    path = os.path.join('data', 'furniture.json')
    with open(path) as f:
        data = json.load(f)
    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'cost' in item
        assert 'unlocks' in item
        assert isinstance(item['unlocks'], list)
        assert 'image' in item


def test_research_fields():
    path = os.path.join('data', 'research.json')
    with open(path) as f:
        data = json.load(f)
    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'cost' in item
        assert 'unlocks' in item
        assert isinstance(item['unlocks'], list)
        assert 'image' in item
