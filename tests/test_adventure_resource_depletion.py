import json
import subprocess


def run_script():
    script = r"""
const { State, ResourceSystem } = require('./js/state.js');

global.State = State;
global.ResourceSystem = ResourceSystem;
global.ItemGenerator = { itemList: [], generateFromEncounter: () => null };
global.Inventory = { add: () => {} };
global.Lang = { log: () => '', resource: () => '' };
global.Log = { add: () => {} };
global.StorySystem = { trigger: () => {} };

global.PubSub = { events: [], publish(ev) { this.events.push(ev); } };

const { EncounterGenerator } = require('./js/encounter.js');

const encounter = {
    id: 'test',
    loot: {},
    category: 'strength',
    getResourceCost() { return { energy: 10 }; },
    getLootMultiplier() { return 1; },
    getLootChance() { return 0; }
};

State.resources.energy = ResourceSystem.create(10, 10);

const results = [];
for (let i = 0; i < 20; i++) {
    State.resources.energy.value = 10;
    EncounterGenerator.resolve(encounter);
    results.push(10 - State.resources.energy.value);
}
console.log(JSON.stringify({ consumptions: results, events: PubSub.events }));
"""
    proc = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_resource_consumption_random_within_range():
    data = run_script()
    consumptions = data['consumptions']
    assert all(0 <= c <= 10 for c in consumptions)
    assert max(consumptions) > 0
    assert len(set(consumptions)) > 1
    events = data['events']
    assert len(events) == 20
    assert all(e == 'resources:updated' for e in events)
