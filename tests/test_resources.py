import json
import os


def test_progression_schema_uses_stats_as_primary_runtime_layer():
    path = os.path.join('data', 'resources.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    assert 'stats' in data
    assert 'resources' in data
    assert 'prestige' in data

    assert isinstance(data['stats'], dict)
    assert set(data['stats']) >= {'strength', 'intelligence', 'agility', 'constitution', 'will'}
    for entry in data['stats'].values():
        assert 'value' in entry and 'baseMax' in entry
        assert isinstance(entry['value'], (int, float))
        assert isinstance(entry['baseMax'], (int, float))
        assert entry['baseMax'] >= entry['value']
        assert isinstance(entry.get('description', ''), str)

    assert data['resources'] == {}

    assert isinstance(data['prestige'], dict)
    for entry in data['prestige'].values():
        assert 'value' in entry
        assert isinstance(entry['value'], (int, float))
        assert isinstance(entry.get('description', ''), str)
