import subprocess


def test_encounter_level_reset_and_max_persist():
    script = r"""
const state = require('./js/state.js');
const { AdventureEngine } = require('./js/adventure_engine.js');
const { EncounterGenerator } = require('./js/encounter.js');

global.State = state.State;
global.setState = state.setState;
global.ResourceSystem = state.ResourceSystem;

global.EncounterGenerator = EncounterGenerator;
global.PubSub = { publish: () => {} };
global.updateSlotUI = () => {};
global.updateAdventureSlotUI = () => {};

EncounterGenerator.randomEncounter = () => null;
EncounterGenerator.populateSlots = () => {};

EncounterGenerator.incrementLevel();
EncounterGenerator.incrementLevel();
console.log(State.encounterLevel);
console.log(State.maxEncounterLevel);

AdventureEngine.start();
console.log(State.encounterLevel);
console.log(State.maxEncounterLevel);
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    lines = result.stdout.strip().splitlines()
    assert lines[0] == '3'
    assert lines[1] == '3'
    assert lines[2] == '1'
    assert lines[3] == '3'
