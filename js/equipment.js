// Equipment system manages equipping items to character slots.
//
// Dependencies:
//  - state.js: reads and updates State.equipment
//  - items.js: verifies item type via ItemGenerator
//  - pubsub.js: publishes equipment change events
//
// Exports:
//  - Equipment: { equip(itemId, slot?), unequip(slot) }

const Equipment = {
    equip(itemId, slot) {
        if (!State.inventory[itemId]) return false;
        const item = ItemGenerator.itemList.find(i => i.id === itemId);
        if (!item || item.type !== 'equipment' || !item.slot) return false;
        if (slot && slot !== item.slot) return false;
        const targetSlot = item.slot;
        State.equipment[targetSlot] = itemId;
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('equipment:equipped', { slot: targetSlot, itemId });
            PubSub.publish('equipment:changed', State.equipment);
        }
        return true;
    },
    unequip(slot) {
        const itemId = State.equipment[slot];
        if (!itemId) return false;
        State.equipment[slot] = null;
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('equipment:unequipped', { slot, itemId });
            PubSub.publish('equipment:changed', State.equipment);
        }
        return true;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Equipment };
}
