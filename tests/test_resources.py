import json
import os


def test_resources_structure():
    path = os.path.join('data', 'resources.json')
    with open(path) as f:
        data = json.load(f)
    assert 'stats' in data
    assert 'resources' in data
    assert 'prestige' in data
    for section in ['stats', 'resources', 'prestige']:
        assert isinstance(data[section], dict)
        for entry in data[section].values():
            assert 'value' in entry
            assert isinstance(entry['value'], (int, float))
            assert 'description' in entry
            assert isinstance(entry['description'], str)
            if section != 'prestige':
                assert 'baseMax' in entry
                assert isinstance(entry['baseMax'], (int, float))
                assert entry['baseMax'] >= entry['value']


def test_uk_translations_exist():
    with open(os.path.join('data', 'resources.json')) as f:
        data = json.load(f)
    with open(os.path.join('data', 'lang', 'uk.json')) as f:
        lang = json.load(f)
    for name in data['stats']:
        assert name in lang.get('statDescriptions', {})
    for name in data['resources']:
        assert name in lang.get('resourceDescriptions', {})
    for name in data['prestige']:
        assert name in lang.get('prestigeDescriptions', {})
