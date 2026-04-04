import json
import os


def test_encounter_fields():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    for enc in data:
        assert 'category' in enc
        assert 'dungeon' in enc
        assert isinstance(enc['dungeon'], str)
        assert 'baseDuration' in enc
        assert isinstance(enc['baseDuration'], (int, float))
        assert enc['baseDuration'] > 0
        assert 'resourceConsumption' in enc
        assert isinstance(enc['resourceConsumption'], dict)
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
        if 'weight' in enc:
            assert enc['weight'] > 0
        if 'statFactors' in enc:
            assert isinstance(enc['statFactors'], dict)


def test_story_encounter():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    story = next(e for e in data if e['id'] == 'banditsAmbush')
    assert story['rarity'] == 'story'
    assert story['dungeon'] == 'bandit_road'
    assert not story['items']
    expected_loot = {
        'gem': 1,
        'iron_sword': 1,
        'wooden_shield': 1,
        'leather_armor': 1,
        'bandit_token': 2,
        'smuggled_map': 1,
    }
    assert story['loot'] == expected_loot


def test_no_max_level_property():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    assert all('maxLevel' not in e for e in data)


def test_loot_yield_constant_present():
    path = os.path.join('js', 'encounter.js')
    with open(path, encoding='utf-8') as f:
        text = f.read()
    assert 'lootYieldBonusPerStat' in text


def test_base_duration_scale_present():
    path = os.path.join('js', 'encounter.js')
    with open(path, encoding='utf-8') as f:
        text = f.read()
    assert 'baseDurationScale' in text


def test_base_durations_by_rarity():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    expected = {
        'common': 1,
        'rare': 2,
        'epic': 5,
        'legendary': 10,
        'story': 10,
    }
    overrides = {
        'abandonedCamp': 2,
    }
    for enc in data:
        if enc['id'] in overrides:
            assert enc['baseDuration'] == overrides[enc['id']]
        else:
            assert enc['baseDuration'] == expected[enc['rarity']]


def test_oversee_lumber_team_exists():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    enc = next(e for e in data if e['id'] == 'overseeLumberTeam')
    assert enc['dungeon'] == 'quarry_edge'
    assert enc['loot'].get('wood_log') == 1
    assert enc['items'].get('sturdy_bark') == 0.25


def test_combat_encounters_define_enemy_payload():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    combat_encounters = [enc for enc in data if enc.get('combat')]
    assert combat_encounters
    for enc in combat_encounters:
        enemy = enc.get('enemy')
        assert isinstance(enemy, dict)
        for key in ['name', 'sprite', 'maxHp', 'attack', 'defense', 'speed']:
            assert key in enemy


def test_dungeon_catalog_metadata_present():
    path = os.path.join('data', 'encounters.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    dungeons = {enc['dungeon'] for enc in data if enc['id'] != 'recover'}
    assert {'frontier', 'deep_woods', 'quarry_edge', 'ancient_vault'}.issubset(dungeons)
    weighted = [enc for enc in data if 'weight' in enc]
    assert weighted


def test_dungeon_unlock_metadata_present():
    path = os.path.join('data', 'dungeons.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    frontier = next(d for d in data if d['id'] == 'frontier')
    assert frontier['unlock']['type'] == 'always'
    locked_routes = [d for d in data if d['id'] != 'frontier']
    assert all('unlock' in dungeon for dungeon in locked_routes)
    assert any('dungeonClears' in dungeon['unlock'] for dungeon in locked_routes)


def test_non_frontier_dungeons_have_signature_reward_tracks():
    with open(os.path.join('data', 'encounters.json'), encoding='utf-8') as f:
        encounters = json.load(f)
    with open(os.path.join('data', 'dungeons.json'), encoding='utf-8') as f:
        dungeons = json.load(f)

    all_dungeon_items = {}
    for encounter in encounters:
        dungeon = encounter.get('dungeon')
        if not dungeon or encounter['id'] == 'recover':
            continue
        all_dungeon_items.setdefault(dungeon, set())
        all_dungeon_items[dungeon].update(encounter.get('items', {}).keys())
        all_dungeon_items[dungeon].update(encounter.get('loot', {}).keys())

    for dungeon in dungeons:
        if dungeon['id'] == 'frontier':
            continue
        own = all_dungeon_items.get(dungeon['id'], set())
        others = set().union(*[items for key, items in all_dungeon_items.items() if key != dungeon['id']])
        unique = own - others
        assert len(unique) >= 2


def test_random_encounter_prefers_selected_dungeon():
    import subprocess

    script = r"""
const { EncounterGenerator } = require('./js/encounter.js');
global.State = { currentDungeon: 'ancient_vault', banditsAmbushSeen: false };
global.Utils = { weightedRandomChoice(pool){ return pool[0]; } };
EncounterGenerator.level = 50;
EncounterGenerator.encounters = [
  { id: 'frontier1', dungeon: 'frontier', rarity: 'common', minLevel: 0 },
  { id: 'vault1', dungeon: 'ancient_vault', rarity: 'rare', minLevel: 0 },
  { id: 'recover', dungeon: 'frontier', rarity: 'common', minLevel: 0 }
];
const encounter = EncounterGenerator.randomEncounter();
console.log(JSON.stringify(encounter));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['id'] == 'vault1'
