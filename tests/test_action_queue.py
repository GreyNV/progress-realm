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


def test_action_queue_resumes_at_thresholds():
    script = r"""
const { ActionEngine } = require('./js/action_engine.js');
let publishCount = 0;
global.State = {
    defaultActionId: 'idle',
    time: 1,
    slots: [{ actionId: 'idle', progress: 0, blocked: false, text: '', queue: null }],
    resources: {
        gold: { value: 4, baseMax: 5, maxAdditions: [], maxMultipliers: [] },
        mana: { value: 4, baseMax: 6, maxAdditions: [], maxMultipliers: [] }
    }
};
global.actions = {
    idle: { name: 'Idle', progress: 0 },
    work: { name: 'Work', progress: 0, resourceCost: { gold: 2 }, resourceConsumption: { mana: 1 } }
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
global.PubSub = {
    publish: event => {
        if (event === 'resources:updated') publishCount += 1;
    }
};
global.SoftCapSystem = {
    apply: () => {},
    getResourceCap: name => name === 'mana' ? 4 : undefined
};
global.checkHealth = () => {};
global.SaveSystem = { save: () => {} };

const states = [];
function snapshot(label) {
    states.push({
        label,
        slot: JSON.parse(JSON.stringify(State.slots[0])),
        resources: JSON.parse(JSON.stringify(State.resources)),
        publishCount
    });
}

ActionEngine.start(0, 'work');
snapshot('start');

ActionEngine.tick(2);
snapshot('queuedForCost');

State.resources.gold.value = 2;
State.resources.mana.value = 4;
ActionEngine.tick(0);
snapshot('resumedAtThreshold');

State.resources.mana.value = 0;
ActionEngine.tick(1);
snapshot('queuedForConsumption');

State.resources.mana.value = 4;
ActionEngine.tick(0);
snapshot('resumedAfterConsumption');

console.log(JSON.stringify(states));
"""
    result = subprocess.run(
        ['node', '-e', script], check=True, capture_output=True, text=True
    )
    states = json.loads(result.stdout.strip())
    assert len(states) == 5

    start_state = states[0]
    queued_cost = states[1]
    resumed_cost = states[2]
    queued_consumption = states[3]
    resumed_consumption = states[4]

    assert start_state['slot']['actionId'] == 'work'
    assert start_state['resources']['gold']['value'] == 2
    assert start_state['resources']['mana']['value'] == 4
    assert start_state['publishCount'] == 1

    assert queued_cost['slot']['actionId'] == 'idle'
    assert queued_cost['slot']['queue']['id'] == 'work'
    assert queued_cost['slot']['queue']['costPaid'] is False
    assert queued_cost['resources']['gold']['value'] == 0
    assert queued_cost['resources']['mana']['value'] == 2
    assert queued_cost['publishCount'] == 3

    assert resumed_cost['slot']['actionId'] == 'work'
    assert resumed_cost['slot']['queue'] is None
    assert resumed_cost['resources']['gold']['value'] == 0
    assert resumed_cost['resources']['mana']['value'] == 4
    assert resumed_cost['resources']['gold']['value'] < resumed_cost['resources']['gold']['baseMax']
    assert resumed_cost['resources']['mana']['value'] < resumed_cost['resources']['mana']['baseMax']
    assert resumed_cost['publishCount'] == 5

    assert queued_consumption['slot']['actionId'] == 'idle'
    assert queued_consumption['slot']['queue']['costPaid'] is True
    assert queued_consumption['resources']['mana']['value'] == 0
    assert queued_consumption['publishCount'] == 5

    assert resumed_consumption['slot']['actionId'] == 'work'
    assert resumed_consumption['slot']['queue'] is None
    assert resumed_consumption['resources']['mana']['value'] == 4
    assert resumed_consumption['resources']['mana']['value'] < resumed_consumption['resources']['mana']['baseMax']
    assert resumed_consumption['resources']['gold']['value'] == resumed_cost['resources']['gold']['value']
    assert resumed_consumption['publishCount'] == 6
