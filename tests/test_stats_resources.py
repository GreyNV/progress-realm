import json
import os


def test_stats_fields():
    path = os.path.join('data', 'stats.json')
    with open(path) as f:
        data = json.load(f)
    assert isinstance(data, list)
    for s in data:
        assert 'id' in s
        assert 'baseValue' in s
        assert 'baseMax' in s
        assert isinstance(s['baseValue'], (int, float))
        assert isinstance(s['baseMax'], (int, float))
        assert s['baseMax'] >= s['baseValue']


def test_resources_fields():
    path = os.path.join('data', 'resources.json')
    with open(path) as f:
        data = json.load(f)
    assert isinstance(data, list)
    for r in data:
        assert 'id' in r
        assert 'baseValue' in r
        assert 'baseMax' in r
        assert isinstance(r['baseValue'], (int, float))
        assert isinstance(r['baseMax'], (int, float))
        assert r['baseMax'] >= r['baseValue']
