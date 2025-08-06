import os
import json
import subprocess


def test_character_ui_mentions_equipment():
    path = os.path.join('js', 'ui', 'character.js')
    with open(path) as f:
        text = f.read()
    assert 'Lang.ui' in text
    assert 'equipment:changed' in text
    assert 'Equipment' in text


def test_character_translation_has_sections():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Equipment' in ui
    assert 'Character' in ui


def test_clicking_slot_unequips_item():
    script = r"""
class Elem {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.style = {};
    this.dataset = {};
    this.textContent = '';
    this._innerHTML = '';
    this.eventListeners = {};
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
  'character-slots-left': new Elem('div'),
  'character-slots-right': new Elem('div'),
  'equipment-items': new Elem('div'),
  'character-image': new Elem('div')
  'character-image': new Elem('img')
};

global.document = {
  getElementById(id){ return elements[id]; },
  createElement(tag){ return new Elem(tag); }
};

global.State = {
  equipment: { head:'stone_spear', armor:null, leftHand:null, rightHand:null, pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null }
};

global.ItemGenerator = { itemList: [{ id:'stone_spear', type:'equipment', slot:'head', name:'stone spear', rarity:'common' }] };
global.Lang = { ui: k => k };
global.capitalize = s => s;

const { Equipment } = require('./js/equipment.js');
Equipment.unequip = slot => { State.equipment[slot] = null; };
const { CharacterUI } = require('./js/ui/character.js');

CharacterUI.init();

const slot = elements['character-slots-left'].children[0];
slot.click();

console.log(JSON.stringify({ head: State.equipment.head }));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['head'] is None

