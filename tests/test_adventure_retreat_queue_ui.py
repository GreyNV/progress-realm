import json
import subprocess

import pytest


SCRIPT = r"""
class Elem {
    constructor(tag) {
        this.tagName = (tag || '').toLowerCase();
        this.children = [];
        this.className = '';
        this.dataset = {};
        this.style = {};
        this.textContent = '';
        this.value = 0;
        this.eventListeners = {};
        this.parent = null;
        this.classList = {
            add: cls => {
                const parts = this.className ? this.className.split(' ') : [];
                if (!parts.includes(cls)) {
                    parts.push(cls);
                    this.className = parts.join(' ').trim();
                }
            },
            remove: cls => {
                const parts = this.className ? this.className.split(' ') : [];
                this.className = parts.filter(c => c && c !== cls).join(' ');
            },
            toggle: (cls, force) => {
                const shouldAdd = force !== undefined ? force : !this.classList.contains(cls);
                if (shouldAdd) {
                    this.classList.add(cls);
                } else {
                    this.classList.remove(cls);
                }
            },
            contains: cls => {
                const parts = this.className ? this.className.split(' ') : [];
                return parts.includes(cls);
            }
        };
    }

    appendChild(child) {
        this.children.push(child);
        child.parent = this;
        return child;
    }

    querySelector(sel) {
        if (!sel) return null;
        if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            for (const child of this.children) {
                if ((child.className || '').split(' ').includes(cls)) {
                    return child;
                }
                const nested = child.querySelector(sel);
                if (nested) return nested;
            }
        } else {
            const tag = sel.toLowerCase();
            for (const child of this.children) {
                if ((child.tagName || '').toLowerCase() === tag) {
                    return child;
                }
                const nested = child.querySelector(sel);
                if (nested) return nested;
            }
        }
        return null;
    }
}

global.document = {
    createElement: tag => new Elem(tag),
    querySelector: () => null,
    getElementById: () => null
};

const { BaseSlot } = require('./js/slot.js');

const mainSlot = new BaseSlot();
mainSlot.el.dataset.slot = '0';
const queueSlot = new BaseSlot();
queueSlot.el.dataset.queue = '0';
queueSlot.el.classList.add('queue-slot');
const adventureSlot = new BaseSlot();
adventureSlot.el.dataset.slot = '0';

const lookup = {
    '#slots .slot[data-slot="0"]': mainSlot.el,
    '#slots .slot[data-queue="0"]': queueSlot.el,
    '#adventure-slots .slot[data-slot="0"]': adventureSlot.el
};

document.querySelector = sel => lookup[sel] || null;

global.window = {};

const state = require('./js/state.js');
const { State, setState, updateState, pushState, ResourceSystem } = state;

global.State = State;
global.setState = setState;
global.updateState = updateState;
global.pushState = pushState;
global.ResourceSystem = ResourceSystem;

global.RARITY_CLASSES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
global.capitalize = s => s;
global.getActionTier = () => 'common';
global.computeActionYield = () => ({ stats: {}, resources: {} });
global.Utils = { formatCost: () => '' };
global.formatNumber = value => Number(value || 0).toFixed(3);
global.Lang = {
    ui: () => '',
    stat: s => s,
    resource: r => r,
    log: () => '',
    encounter: e => e
};
global.Log = { add: () => {} };
global.PubSub = { publish: () => {} };
global.ItemGenerator = { itemList: [], generateFromEncounter: () => null };
global.Inventory = { add: () => {} };
global.StorySystem = { trigger: () => {} };
global.SoftCapSystem = {
    getResourceCap: () => undefined,
    recalculateCaps: () => {},
    refreshCaps: () => {}
};

const { EncounterGenerator } = require('./js/encounter.js');
global.EncounterGenerator = EncounterGenerator;
EncounterGenerator.updateName = () => {};
EncounterGenerator.updateProgressBar = () => {};
EncounterGenerator.populateSlots = EncounterGenerator.populateSlots || (() => {});
EncounterGenerator.resolve = EncounterGenerator.resolve || (() => {});
EncounterGenerator.decrementLevel = () => {};
EncounterGenerator.resetProgress = () => {};

global.actions = {
    rest: { name: 'Rest', level: 1, progress: 0, image: 'rest.png' }
};
State.slots[0].actionId = 'rest';

const slotSetup = require('./js/slotSetup.js');
global.updateSlotUI = slotSetup.updateSlotUI;
global.updateAdventureSlotUI = slotSetup.updateAdventureSlotUI;

const { AdventureEngine, retreat } = require('./js/adventure_engine.js');

const encounter = {
    id: 'retreat-test',
    name: 'Retreating Encounter',
    description: 'Retreat description',
    image: 'retreat.png',
    rarity: 'rare',
    getDuration() { return 1; },
    getResourceCost() { return { energy: 6 }; }
};

EncounterGenerator.randomEncounter = () => encounter;

State.resources.health = ResourceSystem.create(10, 10, 'health');
State.resources.energy = ResourceSystem.create(10, 10, 'energy');
State.resources.focus = ResourceSystem.create(10, 10, 'focus');
State.resources.health.value = 10;
State.resources.energy.value = 10;
State.resources.focus.value = 10;

AdventureEngine.start();

const adventureSlotState = State.adventureSlots[0];
adventureSlotState.progress = 0.42;

State.resources.health.value = 0;
State.resources.energy.value = 0;

retreat('health');

const queueData = adventureSlotState.queue;
const queueSlotEl = queueSlot.el;
const queueProgressEl = queueSlotEl.querySelector('progress');

const results = {
    afterRetreat: {
        storedEncounterId: queueData && queueData.encounter ? queueData.encounter.id : null,
        storedProgress: queueData ? queueData.progress : null,
        label: queueSlotEl.querySelector('.label').textContent,
        hidden: queueSlotEl.classList.contains('hidden'),
        background: queueSlotEl.style.backgroundImage || '',
        backgroundSize: queueSlotEl.style.backgroundSize || '',
        tooltip: queueSlotEl.dataset.tooltip || '',
        progressValue: queueProgressEl ? queueProgressEl.value : null
    }
};

State.resources.health.value = 10;
State.resources.energy.value = 10;

AdventureEngine.tick(1);

const postQueueSlot = queueSlot.el;
const postProgressEl = postQueueSlot.querySelector('progress');

results.afterTick = {
    queue: adventureSlotState.queue || null,
    hidden: postQueueSlot.classList.contains('hidden'),
    label: postQueueSlot.querySelector('.label').textContent,
    background: postQueueSlot.style.backgroundImage || '',
    backgroundSize: postQueueSlot.style.backgroundSize || '',
    progressValue: postProgressEl ? postProgressEl.value : null
};

results.active = AdventureEngine.active;
results.activeIndex = AdventureEngine.activeIndex;
results.activeEncounterId = adventureSlotState.encounter ? adventureSlotState.encounter.id : null;

console.log(JSON.stringify(results));
"""


def run_script():
    proc = subprocess.run(['node', '-e', SCRIPT], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout.strip())


def test_retreat_queue_slot_shows_encounter_and_clears():
    data = run_script()

    after_retreat = data['afterRetreat']
    assert after_retreat['storedEncounterId'] == 'retreat-test'
    assert after_retreat['storedProgress'] == pytest.approx(0.42)
    assert after_retreat['label'] == 'Retreating Encounter'
    assert after_retreat['hidden'] is False
    assert 'retreat.png' in after_retreat['background']
    assert after_retreat['backgroundSize'] == 'cover'
    assert after_retreat['tooltip'] == 'Retreat description'
    assert after_retreat['progressValue'] == pytest.approx(0.42)

    after_tick = data['afterTick']
    assert after_tick['queue'] is None
    assert after_tick['hidden'] is True
    assert after_tick['label'] == ''
    assert after_tick['background'] == 'none'
    assert after_tick['backgroundSize'] == ''
    assert after_tick['progressValue'] == 0

    assert data['active'] is True
    assert data['activeIndex'] == 0
    assert data['activeEncounterId'] == 'retreat-test'
