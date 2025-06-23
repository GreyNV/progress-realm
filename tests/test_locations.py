import json
import os

def test_location_fields():
    path = os.path.join('data', 'locations.json')
    with open(path) as f:
        data = json.load(f)
    assert isinstance(data, list)
    for loc in data:
        assert 'level' in loc
        assert 'name' in loc
        assert isinstance(loc['level'], int)
        assert isinstance(loc['name'], str)
