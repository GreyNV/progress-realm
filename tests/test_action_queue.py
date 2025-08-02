import json
import os
import subprocess


def test_queue_property_in_state():
    with open(os.path.join('js', 'state.js')) as f:
        text = f.read()
    assert 'queue:' in text


def test_queue_slot_styles_defined():
    with open(os.path.join('css', 'styles.css')) as f:
        text = f.read()
    assert '.queue-slot' in text and '.slot-wrapper' in text


def test_queued_action_resumes_only_at_max():
    script = r"""
const { ActionEngine } = require('./js/action_engine.js');
global.State = {
    defaultActionId: 'idle',
    time: 1,
    slots: [{ actionId: 'idle', progress: 0, blocked: false, text: '', queue: null }],
    resources: {
        gold: { value: 5, baseMax: 10, maxAdditions: [], maxMultipliers: [] },
        mana: { value: 9, baseMax: 10, maxAdditions: [], maxMultipliers: [] }
    }
};
global.actions = {
    idle: { name: 'Idle', progress: 0 },
    work: { name: 'Work', progress: 0, resourceCost: { gold: 1 }, resourceConsumption: { mana: 1 } }
};
global.ResourceSystem = {
    max: res => res.baseMax,
    consume: (res, amt) => { res.value -= amt; }
};
global.DeltaEngine = { calculate: () => {}, apply: () => {} };
global.updateSlotUI = () => {};
global.FurnitureSystem = {};
global.canAfford = () => null;
global.scalingMultiplier = () => 1;
global.applyYield = () => {};
global.gainExp = () => {};
global.PubSub = { publish: () => {} };
global.SoftCapSystem = { apply: () => {} };
global.checkHealth = () => {};
global.SaveSystem = { save: () => {} };

ActionEngine.start(0, 'work');
console.log(JSON.stringify(State.slots[0]));
ActionEngine.tick(1);
console.log(JSON.stringify(State.slots[0]));
State.resources.gold.value = State.resources.gold.baseMax;
ActionEngine.tick(1);
console.log(JSON.stringify(State.slots[0]));
State.resources.mana.value = State.resources.mana.baseMax;
ActionEngine.tick(0);
console.log(JSON.stringify(State.slots[0]));
"""
    result = subprocess.run(
        ['node', '-e', script], check=True, capture_output=True, text=True
    )
    lines = result.stdout.strip().splitlines()
    assert len(lines) == 4
    start_slot = json.loads(lines[0])
    tick1_slot = json.loads(lines[1])
    tick2_slot = json.loads(lines[2])
    tick3_slot = json.loads(lines[3])
    assert start_slot['actionId'] == 'idle'
    assert start_slot['queue']['id'] == 'work'
    assert tick1_slot['actionId'] == 'idle'
    assert tick2_slot['actionId'] == 'idle'
    assert tick3_slot['actionId'] == 'work'
