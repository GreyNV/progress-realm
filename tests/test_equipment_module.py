import json
import subprocess


def test_equip_and_unequip_publish_events():
    script = r"""
const { Equipment } = require('./js/equipment.js');

global.State = {
    equipment: {
        head:null, armor:null, leftHand:null, rightHand:null, pants:null,
        boots:null, gloves:null, ring1:null, ring2:null, necklace:null
    },
    inventory: { stone_spear: { quantity: 1 } }
};
global.ItemGenerator = {
    itemList: [{ id: 'stone_spear', type: 'equipment', slot: 'rightHand' }]
};
global.setState = function(path, value) {
    State[path[0]][path[1]] = value;
};
global.SaveSystem = { save() {} };
global.PubSub = {
    events: [],
    publish(name, data) { this.events.push({ name, data }); }
};

Equipment.equip('stone_spear');
Equipment.unequip('rightHand');
console.log(JSON.stringify({ equipment: State.equipment, events: PubSub.events }));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['equipment']['rightHand'] is None
    names = [event['name'] for event in data['events']]
    assert names == ['equipment:equipped', 'equipment:changed', 'equipment:unequipped', 'equipment:changed']


def test_consume_rejects_equipped_items():
    script = r"""
const { Item, Inventory } = require('./js/items.js');
global.State = {
    equipment: {
        head:null, armor:null, leftHand:null, rightHand:'stone_spear', pants:null,
        boots:null, gloves:null, ring1:null, ring2:null, necklace:null
    },
    inventory: { stone_spear: { quantity: 1 } }
};
global.Equipment = {
    isEquipped(id) { return id === 'stone_spear'; }
};
global.SoftCapSystem = { recalculateCaps() {} };
global.updateState = function(path, fn) {
    State.inventory[path[1]].quantity = fn(State.inventory[path[1]].quantity);
};
global.deleteState = function(path) {
    delete State.inventory[path[1]];
};
global.PubSub = { publish() {} };
const result = Inventory.consume('stone_spear');
console.log(JSON.stringify({ result, quantity: State.inventory.stone_spear.quantity }));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['result'] is False
    assert data['quantity'] == 1
