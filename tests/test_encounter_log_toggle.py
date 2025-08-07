import subprocess


def test_encounter_log_toggle():
    script = r"""
const { EncounterGenerator } = require('./js/encounter.js');
function run(show) {
    global.State = { banditsAmbushSeen: true, showEncounterLog: show, resources: {} };
    let count = 0;
    global.Log = { add: () => { count++; } };
    global.Lang = { log: () => null };
    global.ItemGenerator = { itemList: [], generateFromEncounter: () => null };
    global.Inventory = { add: () => {} };
    global.ResourceSystem = { consume: () => {} };
    global.PubSub = { publish: () => {} };
    global.StorySystem = { trigger: () => {} };
    const enc = { id: 'banditsAmbush', loot: {}, name: 'Bandits', getLootMultiplier: () => 1, getLootChance: () => 0, getResourceCost: () => ({}) };
    EncounterGenerator.resolve(enc);
    console.log(count);
}
run(true);
run(false);
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    lines = result.stdout.strip().splitlines()
    assert lines[0] == '1'
    assert lines[1] == '0'

