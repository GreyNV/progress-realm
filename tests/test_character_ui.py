import os
import json
import subprocess


def test_character_ui_mentions_equipment():
    path = os.path.join('js', 'ui', 'character.js')
    with open(path) as f:
        text = f.read()
    assert 'Lang.ui' in text
    assert 'inventory:changed' in text
    assert 'equipment:changed' in text
    assert 'Equipment' in text


def test_character_translation_has_equipment():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Equipment' in ui


def test_equip_button_equips_item():
    script = r"""
class Elem {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.style = {};
    this.dataset = {};
    this.eventListeners = {};
    this.textContent = '';
    this._innerHTML = '';
    this.classList = { add: () => {} };
    Object.defineProperty(this, 'innerHTML', {
      get: () => this._innerHTML,
      set: v => { this._innerHTML = v; if (v === '') this.children = []; }
    });
  }
  appendChild(child) { this.children.push(child); }
  addEventListener(ev, fn) { this.eventListeners[ev] = fn; }
  click() { if (this.eventListeners['click']) this.eventListeners['click'](); }
}

const elements = {
  'equipment-slots': new Elem('div'),
  'equipment-items': new Elem('div'),
  'equipment-heading': new Elem('div')
};

global.document = {
  getElementById(id){ return elements[id]; },
  createElement(tag){ return new Elem(tag); }
};

global.State = {
  equipment: { head:null, armor:null, leftHand:null, rightHand:null, pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null },
  inventory: { stone_spear: { quantity: 1 } }
};

global.ItemGenerator = { itemList: [{ id:'stone_spear', type:'equipment', slot:'rightHand', name:'stone spear', rarity:'common' }] };
global.Inventory = { getItems: () => [{ id:'stone_spear', type:'equipment', name:'stone spear', rarity:'common' }] };
global.Lang = { ui: k => k };
global.capitalize = s => s;

const { Equipment } = require('./js/equipment.js');
const { CharacterUI } = require('./js/ui/character.js');

CharacterUI.init();

const items = document.getElementById('equipment-items');
const card = items.children[0];
const btn = card.children.find(c => c.tagName === 'button');
btn.click();

console.log(JSON.stringify({ equipped: State.equipment.rightHand }));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['equipped'] == 'stone_spear'

