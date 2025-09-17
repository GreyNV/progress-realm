import json
import subprocess


def test_slot_renders_resource_tags():
    script = r"""
class Elem {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.className = '';
        this.style = {};
        this.dataset = {};
        this.textContent = '';
        this.eventListeners = {};
        this.classList = {
            add: c => { if (!this.className.split(' ').includes(c)) this.className += (this.className ? ' ' : '') + c; },
            remove: c => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); },
            toggle: (c, force) => {
                if (force === undefined) force = !this.classList.contains(c);
                if (force) this.classList.add(c); else this.classList.remove(c);
            },
            contains: c => this.className.split(' ').includes(c)
        };
    }
    appendChild(ch) { this.children.push(ch); ch.parent = this; }
    querySelector(sel) {
        if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            for (const ch of this.children) {
                if (ch.className.split(' ').includes(cls)) return ch;
                const q = ch.querySelector(sel);
                if (q) return q;
            }
        } else {
            const tag = sel.toLowerCase();
            for (const ch of this.children) {
                if (ch.tagName === tag) return ch;
                const q = ch.querySelector(sel);
                if (q) return q;
            }
        }
        return null;
    }
}

global.document = {
    createElement: tag => new Elem(tag),
    querySelector: sel => null
};

const { formatNumber } = require('./js/utils.js');
global.formatNumber = formatNumber;

const { BaseSlot } = require('./js/slot.js');
const slot = new BaseSlot();
slot.el.dataset.slot = '0';
const slots = new Elem('div');
slots.id = 'slots';
slots.appendChild(slot.el);

document.querySelector = sel => {
    if (sel === '#slots .slot[data-slot="0"]') return slot.el;
    if (sel === '#slots .slot[data-queue="0"]') return null;
    return null;
};

const { updateSlotUI } = require('./js/slotSetup.js');

global.actions = {
    work: {
        name: 'Work',
        level: 1,
        progress: 0,
        resourceCost: { gold: 1 },
        resourceConsumption: { mana: 1 },
        baseYield: { resources: { food: 2 }, stats: { strength: 3 } }
    }
};

global.ResourceSystem = { max: r => r.baseMax };
global.StatSystem = { max: s => s.baseMax };
global.State = {
    slots: [{ actionId: 'work', progress: 0, blocked: false, text: '', queue: null }],
    defaultActionId: 'idle',
    resources: {
        gold: { value: 5, baseMax: 10 },
        mana: { value: 3, baseMax: 5 },
        food: { value: 7, baseMax: 15 }
    },
    stats: {
        strength: { value: 8, baseMax: 20 }
    }
};
global.RARITY_CLASSES = ['common'];
global.capitalize = s => s;
global.getActionTier = () => 'common';
global.Utils = { formatCost: () => '' };
global.computeActionYield = a => a.baseYield || {};
global.Lang = { ui: () => '', stat: s => s, resource: r => r };

updateSlotUI(0);
const tagsEl = slot.el.querySelector('.resource-tags');
const rows = tagsEl.children.map(tag => {
    const left = tag.children[0] ? tag.children[0].textContent : '';
    const right = tag.children[1];
    const current = right && right.children[0] ? right.children[0].textContent : (right ? right.textContent : '');
    const softcap = right && right.children[1] ? right.children[1].textContent : null;
    return [left, current, softcap];
});
console.log(JSON.stringify(rows));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data == [
        ['-1.000 gold', '5.000', 'Softcap 10.000'],
        ['-1.000 mana', '3.000', 'Softcap 5.000'],
        ['+2.000 food', '7.000', 'Softcap 15.000'],
        ['+3.000 strength', '8.000', 'Softcap 20.000']
    ]

