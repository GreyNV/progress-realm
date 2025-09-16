import json
import os
import subprocess

import pytest


def test_item_fields():
    item_path = os.path.join('data', 'items.json')
    resource_path = os.path.join('data', 'resources.json')
    with open(item_path) as f:
        data = json.load(f)
    with open(resource_path) as f:
        base_data = json.load(f)
    stat_keys = set(base_data['stats'].keys())
    resource_keys = set(base_data['resources'].keys())
    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'rarity' in item
        assert 'type' in item
        if item['type'] == 'consumable':
            assert 'restore' in item
            assert isinstance(item['restore'], dict)
            assert item['restore']
            restore_keys = set(item['restore'].keys())
            assert restore_keys.issubset(stat_keys)
            assert not restore_keys.intersection(resource_keys)
        else:
            assert 'restore' not in item or item['restore'] == {}
        if item['type'] == 'equipment':
            # Equipment items must define the slot they occupy
            assert 'slot' in item
        assert 'image' in item

def test_consumable_restoration_values():
    path = os.path.join('data', 'items.json')
    with open(path) as f:
        data = json.load(f)
    rabbit = next(i for i in data if i['id'] == 'rabbit_meat')
    assert rabbit['restore']['strength'] > 1
    berries = next(i for i in data if i['id'] == 'berries')
    assert set(berries['restore'].keys()) == {'strength', 'dexterity', 'intelligence'}


def test_inventory_consume_updates_stats_and_events():
    script = r"""
const { ItemGenerator, Inventory } = require('./js/items.js');
global.State = {
    inventory: { berries: { quantity: 2 } },
    stats: {},
    resources: {
        health: { value: 0 }
    },
    equipment: {}
};
const { StatSystem } = require('./js/state.js');
global.StatSystem = StatSystem;
State.stats.strength = StatSystem.create(9, 10, 'strength');
const expected = StatSystem.create(9, 10, 'strength');
StatSystem.add(expected, 3);
global.updateState = function(path, fn) {
    const [root, id, prop] = path;
    if (root === 'inventory' && prop === 'quantity') {
        State.inventory[id][prop] = fn(State.inventory[id][prop]);
    }
};
global.deleteState = function(path) {
    const [root, id] = path;
    if (root === 'inventory') delete State.inventory[id];
};
ItemGenerator.itemList = [
    { id: 'berries', type: 'consumable', restore: { strength: 3, health: 2 } }
];
const events = [];
global.PubSub = { publish: (event) => events.push(event) };

Inventory.consume('berries');

console.log(JSON.stringify({
    inventory: State.inventory,
    resources: State.resources,
    stats: State.stats,
    events,
    expected: expected.value
}));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['inventory']['berries']['quantity'] == 1
    assert data['resources']['health']['value'] == 0
    strength_val = data['stats']['strength']['value']
    assert strength_val == pytest.approx(data['expected'])
    assert strength_val < 12  # confirms soft cap applied instead of linear growth
    assert 'inventory:changed' in data['events']
    assert 'stats:updated' in data['events']
    assert 'resources:updated' not in data['events']
