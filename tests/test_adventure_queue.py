import json
import subprocess


def run_script():
    script = r"""
const { State, ResourceSystem } = require('./js/state.js');
const { canAfford } = require('./js/action_utils.js');

global.State = State;
global.ResourceSystem = ResourceSystem;
global.actions = { rest: { progress: 0, name: 'Rest' } };
global.updateSlotUI = () => {};
global.setState = () => {};
global.updateState = () => {};
global.updateAdventureSlotUI = () => {};
global.EncounterGenerator = {
    randomEncounter: () => null,
    resolve: () => {},
    updateProgressBar: () => {},
    incrementLevel: () => {},
    decrementLevel: () => {},
    resetProgress: () => {},
    populateSlots: () => {}
};
global.canAfford = canAfford;
const { AdventureEngine } = require('./js/adventure_engine.js');

const slot = State.adventureSlots[0];
slot.encounter = {
    id: 'test',
    getDuration() { return 1; },
    getResourceCost() { return { energy: 1 }; }
};
slot.duration = 1;
slot.progress = 0.5;
slot.active = true;

State.resources.energy = ResourceSystem.create(0, 10);
State.resources.health = ResourceSystem.create(100, 100);
AdventureEngine.active = true;
AdventureEngine.activeIndex = 0;

function snapshot() {
    return {
        engineActive: AdventureEngine.active,
        activeIndex: AdventureEngine.activeIndex,
        slotActive: slot.active,
        queue: slot.queue ? { encounterId: slot.queue.encounter.id, progress: slot.queue.progress } : null,
        encounter: slot.encounter ? slot.encounter.id : null,
        progress: slot.progress,
        resource: State.resources.energy.value
    };
}

const results = [];
AdventureEngine.tick(1);
results.push(snapshot());
AdventureEngine.tick(1);
results.push(snapshot());
State.resources.energy.value = ResourceSystem.max(State.resources.energy);
AdventureEngine.tick(1);
results.push(snapshot());

console.log(JSON.stringify(results));
"""
    proc = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_encounter_queue_and_resume():
    results = run_script()
    first, second, third = results

    assert first['queue']['encounterId'] == 'test'
    assert first['queue']['progress'] == 0.5
    assert first['engineActive'] is False
    assert first['encounter'] is None

    assert second['queue'] == first['queue']
    assert second['engineActive'] is False

    assert third['queue'] is None
    assert third['engineActive'] is True
    assert third['encounter'] == 'test'
    assert third['progress'] == 0.5

