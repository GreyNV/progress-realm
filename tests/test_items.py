import json
import os
import subprocess


def test_item_fields():
    path = os.path.join('data', 'items.json')
    with open(path) as f:
        data = json.load(f)
    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'rarity' in item
        assert 'type' in item
        if item['type'] == 'consumable':
            assert 'restore' in item
            assert isinstance(item['restore'], dict)
            assert 'health' in item['restore']
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
    assert rabbit['restore']['health'] > 1
    berries = next(i for i in data if i['id'] == 'berries')
    assert set(berries['restore'].keys()) == {'health', 'energy', 'focus'}


def test_inventory_consume_updates_resources_and_events():
    script = r"""
const { ItemGenerator, Inventory } = require('./js/items.js');
global.State = {
    inventory: { berries: { quantity: 2 } },
    resources: {
        health: { value: 0 },
        energy: { value: 0 },
        focus: { value: 0 }
    },
    equipment: {}
};
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
global.ResourceSystem = {
    add: (res, amt) => { res.value += amt; }
};
ItemGenerator.itemList = [
    { id: 'berries', type: 'consumable', restore: { health: 1, energy: 1, focus: 1 } }
];
const events = [];
global.PubSub = { publish: (event) => events.push(event) };

Inventory.consume('berries');

console.log(JSON.stringify({ inventory: State.inventory, resources: State.resources, events }));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['inventory']['berries']['quantity'] == 1
    assert data['resources']['health']['value'] == 1
    assert data['resources']['energy']['value'] == 1
    assert data['resources']['focus']['value'] == 1
    assert 'inventory:changed' in data['events']
    assert 'resources:updated' in data['events']
