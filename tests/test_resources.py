import json
import os

def test_resources_structure():
    path = os.path.join('data', 'resources.json')
    with open(path) as f:
        data = json.load(f)
    assert 'stats' in data
    assert 'resources' in data
    assert 'prestige' in data
    for section in ['stats', 'resources']:
        assert isinstance(data[section], dict)
        for entry in data[section].values():
            assert 'value' in entry and 'baseMax' in entry
            assert isinstance(entry['value'], (int, float))
            assert isinstance(entry['baseMax'], (int, float))
            assert entry['baseMax'] >= entry['value']
    assert isinstance(data['prestige'], dict)
