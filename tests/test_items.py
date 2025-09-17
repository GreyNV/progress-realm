import json
import os
import subprocess
import textwrap

import pytest


def _run_node_script(script: str) -> dict:
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        check=True,
    )
    output = result.stdout.strip()
    if not output:
        raise AssertionError('Node script produced no output')
    return json.loads(output)


def test_item_fields():
    item_path = os.path.join('data', 'items.json')
    resource_path = os.path.join('data', 'resources.json')
    with open(item_path, encoding='utf-8') as f:
        data = json.load(f)
    with open(resource_path, encoding='utf-8') as f:
        base_data = json.load(f)

    stat_keys = set(base_data['stats'].keys())
    resource_keys = set(base_data['resources'].keys())

    for item in data:
        assert 'id' in item
        assert 'name' in item
        assert 'rarity' in item
        assert 'type' in item

        if item['type'] == 'consumable':
            restore = item.get('restore', {})
            assert isinstance(restore, dict) and restore
            restore_keys = set(restore)
            missing_stats = restore_keys.difference(stat_keys)
            assert not missing_stats, (
                f"Consumable {item['id']} uses non-stat restore keys: {sorted(missing_stats)}"
            )
            assert restore_keys.isdisjoint(resource_keys)
        else:
            assert item.get('restore', {}) in ({}, None)

        if item['type'] == 'equipment':
            # Equipment items must define the slot they occupy
            assert 'slot' in item

        assert 'image' in item


def test_consumable_restoration_values():
    items_path = os.path.join('data', 'items.json')
    base_path = os.path.join('data', 'resources.json')
    with open(items_path, encoding='utf-8') as f:
        data = json.load(f)
    with open(base_path, encoding='utf-8') as f:
        base_data = json.load(f)

    stat_keys = set(base_data['stats'])

    rabbit = next(i for i in data if i['id'] == 'rabbit_meat')
    assert set(rabbit['restore']) == {'strength'}
    assert rabbit['restore']['strength'] > 1
    assert all(key in stat_keys for key in rabbit['restore'])

    berries = next(i for i in data if i['id'] == 'berries')
    assert set(berries['restore'].keys()) == {'strength', 'dexterity', 'intelligence'}
    assert all(key in stat_keys for key in berries['restore'])
    assert all(value > 0 for value in berries['restore'].values())


def test_inventory_consume_updates_stats_and_events():
    script = textwrap.dedent(
        """
        const { ItemGenerator, Inventory } = require('./js/items.js');
        const { StatSystem } = require('./js/state.js');

        global.State = {
            inventory: { berries: { quantity: 2 } },
            stats: {},
            resources: { health: { value: 25 } },
            equipment: {},
        };
        global.StatSystem = StatSystem;
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

        State.stats.strength = StatSystem.create(9, 10, 'strength');
        const before = State.stats.strength.value;
        const expected = StatSystem.create(9, 10, 'strength');
        StatSystem.add(expected, 3);

        ItemGenerator.itemList = [
            { id: 'berries', type: 'consumable', restore: { strength: 3 } }
        ];

        const events = [];
        global.PubSub = { publish: (event) => events.push(event) };

        Inventory.consume('berries');

        console.log(JSON.stringify({
            before,
            restore: ItemGenerator.itemList[0].restore.strength,
            inventory: State.inventory,
            resources: State.resources,
            stats: State.stats,
            events,
            expected: expected.value
        }));
        """
    )

    data = _run_node_script(script)
    assert data['inventory']['berries']['quantity'] == 1
    assert data['resources']['health']['value'] == 25
    strength_val = data['stats']['strength']['value']
    assert strength_val == pytest.approx(data['expected'])
    assert strength_val > data['before']
    assert strength_val < data['before'] + data['restore']
    assert 'inventory:changed' in data['events']
    assert 'stats:updated' in data['events']
    assert 'resources:updated' not in data['events']


def test_consumable_diminishing_returns_after_soft_cap():
    script = textwrap.dedent(
        """
        const { ItemGenerator, Inventory } = require('./js/items.js');
        const { StatSystem } = require('./js/state.js');

        global.State = {
            inventory: { tonic: { quantity: 2 } },
            stats: {},
            resources: {},
            equipment: {},
        };
        global.StatSystem = StatSystem;
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

        State.stats.strength = StatSystem.create(0, 10, 'strength');

        ItemGenerator.itemList = [
            { id: 'tonic', type: 'consumable', restore: { strength: 5 } }
        ];

        const beforeFirst = State.stats.strength.value;
        Inventory.consume('tonic');
        const afterFirst = State.stats.strength.value;
        const gainBefore = afterFirst - beforeFirst;

        StatSystem.add(State.stats.strength, 10);
        const beforeSecond = State.stats.strength.value;
        Inventory.consume('tonic');
        const afterSecond = State.stats.strength.value;
        const gainAfter = afterSecond - beforeSecond;

        const finalQuantity = State.inventory.tonic ? State.inventory.tonic.quantity : 0;

        console.log(JSON.stringify({
            gainBefore,
            gainAfter,
            afterFirst,
            beforeSecond,
            afterSecond,
            restore: ItemGenerator.itemList[0].restore.strength,
            finalQuantity
        }));
        """
    )

    data = _run_node_script(script)
    assert data['finalQuantity'] == 0
    assert data['gainBefore'] == pytest.approx(data['restore'])
    assert data['gainAfter'] > 0
    assert data['gainAfter'] < data['gainBefore']
    assert data['gainAfter'] < data['restore']
    assert data['afterSecond'] > data['afterFirst']
