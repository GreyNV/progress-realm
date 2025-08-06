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
    assert '.resource-tags' in text and '.resource-tag' in text


def test_action_repeats_queues_and_resumes_at_max():
    script = r"""
const { ActionEngine } = require('./js/action_engine.js');
global.State = {
    defaultActionId: 'idle',
    time: 1,
    slots: [{ actionId: 'idle', progress: 0, blocked: false, text: '', queue: null }],
    resources: {
        gold: { value: 2, baseMax: 2, maxAdditions: [], maxMultipliers: [] },
        mana: { value: 2, baseMax: 2, maxAdditions: [], maxMultipliers: [] }
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
global.canAfford = (costs, delta) => {
    for (const r in costs) {
        const amt = costs[r] * State.time * delta;
        if (State.resources[r].value < amt) return true;
    }
    return null;
};
global.scalingMultiplier = () => 1;
global.applyYield = () => {};
global.gainExp = () => {};
global.PubSub = { publish: () => {} };
global.SoftCapSystem = { apply: () => {} };
global.checkHealth = () => {};
global.SaveSystem = { save: () => {} };

ActionEngine.start(0, 'work');
console.log(JSON.stringify({slot: State.slots[0], res: State.resources}));
ActionEngine.tick(2);
console.log(JSON.stringify({slot: State.slots[0], res: State.resources}));
State.resources.gold.value = State.resources.gold.baseMax;
ActionEngine.tick(1);
console.log(JSON.stringify({slot: State.slots[0], res: State.resources}));
State.resources.mana.value = State.resources.mana.baseMax;
ActionEngine.tick(0);
console.log(JSON.stringify({slot: State.slots[0], res: State.resources}));
"""
    result = subprocess.run(
        ['node', '-e', script], check=True, capture_output=True, text=True
    )
    lines = result.stdout.strip().splitlines()
    assert len(lines) == 4
    start_state = json.loads(lines[0])
    tick1_state = json.loads(lines[1])
    tick2_state = json.loads(lines[2])
    tick3_state = json.loads(lines[3])
    # action starts and runs immediately
    assert start_state['slot']['actionId'] == 'work'
    # after resources drop below cost, action queues and default runs
    assert tick1_state['slot']['actionId'] == 'idle'
    assert tick1_state['slot']['queue']['id'] == 'work'
    assert tick1_state['res']['gold']['value'] == 0
    # replenishing only gold is not enough to resume
    assert tick2_state['slot']['actionId'] == 'idle'
    # once all resources are at max, queued action resumes
    assert tick3_state['slot']['actionId'] == 'work'
