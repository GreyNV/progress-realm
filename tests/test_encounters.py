import json
import os

def test_encounter_fields():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)
    for enc in data:
        assert 'category' in enc
        assert 'baseDuration' in enc
        assert isinstance(enc['baseDuration'], (int, float))
        assert enc['baseDuration'] > 0
        assert 'level' in enc
        assert isinstance(enc['level'], int)
        assert enc['level'] >= 1
