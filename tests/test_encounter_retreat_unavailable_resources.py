import json
import subprocess


def run_script():
    script = r"""
const { State, ResourceSystem } = require('./js/state.js');

global.State = State;
State.resources = {};
State.resources.energy = ResourceSystem.create(5, 10);
State.resources.health = ResourceSystem.create(20, 20);

global.ItemGenerator = { itemList: [], generateFromEncounter: () => null };
global.Inventory = { add: () => {} };
global.Lang = { log: () => '', resource: () => '' };
global.Log = { add: () => {} };
global.StorySystem = { trigger: () => {} };
const events = [];
global.PubSub = { publish: ev => events.push(ev) };

global.retreatCalls = [];
global.retreat = r => retreatCalls.push(r);
Math.random = () => 1;

const { EncounterGenerator } = require('./js/encounter.js');

const encounter = {
    id: 'test',
    loot: {},
    category: 'strength',
    getResourceCost() { return { energy: 10, health: 5 }; },
    getLootMultiplier() { return 1; },
    getLootChance() { return 0; }
};

const calls = [];
const originalConsume = ResourceSystem.consume;
ResourceSystem.consume = (res, amt) => {
    const key = Object.keys(State.resources).find(k => State.resources[k] === res);
    calls.push({ key, amt });
    if (res.value < amt) return false;
    res.value -= amt;
    return true;
};

EncounterGenerator.resolve(encounter);

console.log(JSON.stringify({
    calls,
    retreatCalls,
    energy: State.resources.energy.value,
    health: State.resources.health.value
}));
"""
    proc = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_encounter_retreats_when_resources_missing():
    data = run_script()
    assert data['retreatCalls'] == ['energy']
    assert data['calls'] == [{'key': 'energy', 'amt': 10}]
    assert data['energy'] == 5
    assert data['health'] == 20
