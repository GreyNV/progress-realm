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
        assert 'loot' in enc
        assert isinstance(enc['loot'], dict)
        for qty in enc['loot'].values():
            assert isinstance(qty, (int, float))
            assert qty >= 0


def test_story_encounter():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)
    story = next(e for e in data if e['id'] == 'banditsAmbush')
    assert story['rarity'] == 'story'
    assert not story['items']
    expected_loot = {
        'gem': 1,
        'iron_sword': 1,
        'wooden_shield': 1,
        'leather_armor': 1,
    }
    assert story['loot'] == expected_loot


def test_no_max_level_property():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)

    assert all('maxLevel' not in e for e in data)


def test_loot_yield_constant_present():
    path = os.path.join('js', 'encounter.js')
    with open(path) as f:
        text = f.read()
    assert 'lootYieldBonusPerStat' in text


def test_base_duration_scale_present():
    path = os.path.join('js', 'encounter.js')
    with open(path) as f:
        text = f.read()
    assert 'baseDurationScale' in text


def test_base_durations_by_rarity():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)
    expected = {
        'common': 1,
        'rare': 2,
        'epic': 5,
        'legendary': 10,
        'story': 15,
    }
    for enc in data:
        assert enc['baseDuration'] == expected[enc['rarity']]


def test_oversee_lumber_team_exists():
    path = os.path.join('data', 'encounters.json')
    with open(path) as f:
        data = json.load(f)
    enc = next(e for e in data if e['id'] == 'overseeLumberTeam')
    assert enc['loot'].get('wood_log') == 0.1
    assert enc['items'].get('sturdy_bark') == 0.25
