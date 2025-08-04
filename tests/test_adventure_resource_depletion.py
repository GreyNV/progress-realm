import json
import subprocess


def run_script():
    script = r"""
const { State, ResourceSystem } = require('./js/state.js');
const { canAfford } = require('./js/action_utils.js');

global.State = State;
global.ResourceSystem = ResourceSystem;
global.canAfford = canAfford;
global.updateSlotUI = () => {};
global.setState = () => {};
global.updateState = () => {};
global.updateAdventureSlotUI = () => {};
global.actions = { rest: { progress: 0, name: 'Rest' } };
const encounter = {
    id: 'test',
    getDuration() { return 1; },
    getResourceCost() { return { energy: 1 }; }
};
global.EncounterGenerator = {
    randomEncounter: () => encounter,
    resolve: () => {},
    updateProgressBar: () => {},
    incrementLevel: () => {},
    decrementLevel: () => {},
    resetProgress: () => {},
    populateSlots: () => {}
};

const { AdventureEngine } = require('./js/adventure_engine.js');

State.resources.energy = ResourceSystem.create(0, 10);
State.resources.health = ResourceSystem.create(100, 100);

AdventureEngine.start();
// Simulate the slot being blocked during the encounter
State.slots[0].blocked = true;
AdventureEngine.tick(1);

const slot = State.adventureSlots[0];
const actionSlot = State.slots[0];
console.log(JSON.stringify({
    engineActive: AdventureEngine.active,
    activeIndex: AdventureEngine.activeIndex,
    queue: slot.queue ? slot.queue.encounter.id : null,
    actionId: actionSlot.actionId,
    blocked: actionSlot.blocked
}));
"""
    proc = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_default_action_restored_after_resource_depletion():
    result = run_script()
    assert result['engineActive'] is False
    assert result['activeIndex'] is None
    assert result['queue'] == 'test'
    assert result['actionId'] == 'rest'
    assert result['blocked'] is False

