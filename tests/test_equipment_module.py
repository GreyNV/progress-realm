import json
import subprocess

def test_equip_and_unequip_publish_events():
    script = r"""
const { Equipment } = require('./js/equipment.js');
const { ItemGenerator, Inventory } = require('./js/items.js');

ItemGenerator.itemList = [{ id: 'stone_spear', type: 'equipment' }];

global.State = {
    equipment: { head:null, armor:null, leftHand:null, rightHand:null, pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null },
    inventory: { stone_spear: { quantity: 1 } }
};

global.PubSub = { events: [], publish(name, data){ this.events.push({name, data}); } };

Equipment.equip('stone_spear', 'rightHand');
Equipment.unequip('rightHand');
console.log(JSON.stringify({ equipment: State.equipment, events: PubSub.events }));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['equipment']['rightHand'] is None
    names = [e['name'] for e in data['events']]
    assert names == ['equipment:equipped', 'equipment:changed', 'equipment:unequipped', 'equipment:changed']


def test_consume_rejects_equipped_items():
    script = r"""
const { ItemGenerator, Inventory } = require('./js/items.js');
ItemGenerator.itemList = [{ id: 'stone_spear', type: 'equipment' }];

global.State = {
    equipment: { head:null, armor:null, leftHand:null, rightHand:'stone_spear', pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null },
    inventory: { stone_spear: { quantity: 1 } },
    resources: {}
};

global.updateState = function(path, fn){ const [root,id,prop]=path; if(root==='inventory' && prop==='quantity'){ State.inventory[id][prop]=fn(State.inventory[id][prop]); } };

global.deleteState = function(path){ const [root,id]=path; if(root==='inventory') delete State.inventory[id]; };

global.PubSub = { publish: () => {} };

const result = Inventory.consume('stone_spear');
console.log(JSON.stringify({ result, qty: State.inventory.stone_spear.quantity }));
""";
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(res.stdout.strip())
    assert data['result'] is False
    assert data['qty'] == 1
