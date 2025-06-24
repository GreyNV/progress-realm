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
        assert 'resourceConsumption' in enc
        assert isinstance(enc['resourceConsumption'], dict)
        for val in enc['resourceConsumption'].values():
            assert isinstance(val, (int, float))
            assert val > 0
        assert 'items' in enc
        assert isinstance(enc['items'], dict)
        for prob in enc['items'].values():
            assert isinstance(prob, (int, float))
            assert 0 <= prob <= 1


def test_story_encounter():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)
    story = next(e for e in data if e['id'] == 'banditsAmbush')
    assert story['rarity'] == 'story'
    assert story['items']['gem'] == 1.0
    assert story['items']['iron_sword'] == 1.0
