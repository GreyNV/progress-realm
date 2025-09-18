import json
import subprocess


SCRIPT = r"""
const state = require('./js/state.js');
const { EncounterGenerator } = require('./js/encounter.js');

global.State = state.State;
global.setState = state.setState;
global.updateState = state.updateState;
global.ResourceSystem = state.ResourceSystem;
global.actions = { rest: { name: 'Rest', progress: 0 } };
global.PubSub = { publish: () => {} };
global.updateSlotUI = () => {};
global.updateAdventureSlotUI = () => {};
global.ItemGenerator = { itemList: [], generateFromEncounter: () => null };
global.Inventory = { add: () => {} };
global.Lang = { log: () => '', resource: () => '' };
global.Log = { add: () => {} };
global.StorySystem = { trigger: () => {} };
global.EncounterGenerator = EncounterGenerator;

global.SoftCapSystem = {
    getResourceCap(name) {
        if (name === 'energy') return 8;
        return undefined;
    },
    recalculateCaps: () => {},
    refreshCaps: () => {}
};

const { AdventureEngine } = require('./js/adventure_engine.js');

const testEncounter = {
    id: 'queued',
    name: 'Queued Encounter',
    getDuration() { return 1; },
    getResourceCost() { return { energy: 6 }; }
};

EncounterGenerator.randomEncounter = () => testEncounter;
EncounterGenerator.updateName = () => {};
EncounterGenerator.updateProgressBar = () => {};
EncounterGenerator.populateSlots = EncounterGenerator.populateSlots || (() => {});
EncounterGenerator.decrementLevel = () => {};
EncounterGenerator.resetProgress = () => {};

State.resources.energy = state.ResourceSystem.create(0, 10, 'energy');
State.resources.energy.value = 10;
State.resources.focus = state.ResourceSystem.create(10, 10, 'focus');
State.resources.health = state.ResourceSystem.create(10, 10, 'health');

AdventureEngine.start();

const slot = State.adventureSlots[0];
const queuedEncounter = slot.encounter;
const queuedProgress = slot.progress;

State.resources.energy.value = 0;

AdventureEngine.cancel();

slot.queue = { encounter: queuedEncounter, progress: queuedProgress };
slot.encounter = null;
slot.active = false;

const snapshots = [];

AdventureEngine.tick(1);
snapshots.push({ step: 'zero', active: AdventureEngine.active, queue: !!slot.queue });

State.resources.energy.value = 5;
AdventureEngine.tick(1);
snapshots.push({ step: 'belowCost', active: AdventureEngine.active, queue: !!slot.queue });

State.resources.energy.value = 6;
AdventureEngine.tick(1);
snapshots.push({ step: 'atCost', active: AdventureEngine.active, queue: !!slot.queue, encounterId: slot.encounter && slot.encounter.id });

console.log(JSON.stringify({
    snapshots,
    finalActive: AdventureEngine.active,
    finalActiveIndex: AdventureEngine.activeIndex,
    finalQueue: slot.queue,
    finalEncounterId: slot.encounter && slot.encounter.id
}));
"""


def run_script():
    proc = subprocess.run(['node', '-e', SCRIPT], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_queued_encounter_resumes_at_cost_threshold():
    data = run_script()

    assert len(data['snapshots']) == 3
    snapshots = {entry['step']: entry for entry in data['snapshots']}

    assert snapshots['zero']['active'] is False
    assert snapshots['zero']['queue'] is True

    assert snapshots['belowCost']['active'] is False
    assert snapshots['belowCost']['queue'] is True

    at_cost = snapshots['atCost']
    assert at_cost['active'] is True
    assert at_cost['queue'] is False
    assert at_cost['encounterId'] == 'queued'

    assert data['finalActive'] is True
    assert data['finalQueue'] is None
    assert data['finalEncounterId'] == 'queued'
    assert data['finalActiveIndex'] == 0
