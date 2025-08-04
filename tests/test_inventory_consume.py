import json
import subprocess


# ensure consume reduces stored quantity for consumable items
def test_inventory_consume_decreases_quantity():
    script = r"""
const { ItemGenerator, Inventory } = require('./js/items.js');
global.State = { inventory: { potion: { quantity: 2 } }, resources: {} };
global.updateState = function(path, fn) {
    const [root, id, prop] = path;
    if (root === 'inventory' && prop === 'quantity') {
        State.inventory[id][prop] = fn(State.inventory[id][prop]);
    }
};
global.deleteState = function(path) {
    const [root, id] = path;
    if (root === 'inventory') delete State.inventory[id];
};
global.ItemGenerator = { itemList: [{ id: 'potion', type: 'consumable' }] };
global.PubSub = { publish: () => {} };
Inventory.consume('potion');
console.log(JSON.stringify(State.inventory));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    state = json.loads(result.stdout.strip())
    assert state['potion']['quantity'] == 1
