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

const { AdventureEngine, retreat } = require('./js/adventure_engine.js');

const testEncounter = {
    id: 'test',
    name: 'Test Encounter',
    getDuration() { return 1; },
    getResourceCost() { return { energy: 10 }; }
};

EncounterGenerator.randomEncounter = () => testEncounter;
EncounterGenerator.updateName = () => {};
EncounterGenerator.updateProgressBar = () => {};
EncounterGenerator.populateSlots = EncounterGenerator.populateSlots || (() => {});
EncounterGenerator.decrementLevel = () => {};
EncounterGenerator.resetProgress = () => {};

State.resources.energy = state.ResourceSystem.create(5, 10);
State.resources.focus = state.ResourceSystem.create(10, 10);
State.resources.health = state.ResourceSystem.create(10, 10);

AdventureEngine.start();
const initialAction = State.slots[0].actionId;

State.resources.energy.value = 0;
retreat('energy');

const queuedRestart = State.adventureSlots[0].queue;
const actionAfterRetreat = State.slots[0].actionId;
const activeAfterRetreat = AdventureEngine.active;

AdventureEngine.tick(1);

const stillQueued = State.adventureSlots[0].queue;
const actionBeforeRefill = State.slots[0].actionId;
const activeBeforeRefill = AdventureEngine.active;

State.resources.energy.value = state.ResourceSystem.max(State.resources.energy);
AdventureEngine.tick(1);

const actionAfterRestart = State.slots[0].actionId;
const activeAfterRestart = AdventureEngine.active;
const queueAfterRestart = State.adventureSlots[0].queue;

console.log(JSON.stringify({
    initialAction,
    actionAfterRetreat,
    activeAfterRetreat,
    queuedRestart,
    stillQueued,
    actionBeforeRefill,
    activeBeforeRefill,
    actionAfterRestart,
    activeAfterRestart,
    queueAfterRestart
}));
"""


def run_script():
    proc = subprocess.run(['node', '-e', SCRIPT], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_adventure_restarts_after_resource_recovery():
    data = run_script()

    assert data['initialAction'] is None
    assert data['actionAfterRetreat'] == 'rest'
    assert data['activeAfterRetreat'] is False

    queue = data['queuedRestart']
    assert queue['restart'] is True
    assert set(queue.get('resources', [])) == {'energy'}

    assert data['stillQueued']['restart'] is True
    assert data['actionBeforeRefill'] == 'rest'
    assert data['activeBeforeRefill'] is False

    assert data['actionAfterRestart'] is None
    assert data['activeAfterRestart'] is True
    assert data['queueAfterRestart'] is None
