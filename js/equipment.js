// Equipment system manages equipped inventory items in fixed character slots.
// It uses the existing item metadata and inventory state without changing
// the current softcap-based item effect model.
const Equipment = {
    equip(itemId, slot) {
        if (!State.inventory[itemId]) return false;
        const item = ItemGenerator.itemList.find(i => i.id === itemId);
        if (!item || item.type !== 'equipment' || !item.slot) return false;
        if (slot && slot !== item.slot) return false;

        const targetSlot = item.slot;
        const previousItemId = State.equipment[targetSlot];
        if (previousItemId === itemId) return true;

        setState(['equipment', targetSlot], itemId);
        SaveSystem.save();
        if (typeof PubSub !== 'undefined') {
            if (previousItemId) {
                PubSub.publish('equipment:unequipped', { slot: targetSlot, itemId: previousItemId });
            }
            PubSub.publish('equipment:equipped', { slot: targetSlot, itemId });
            PubSub.publish('equipment:changed', State.equipment);
        }
        return true;
    },

    unequip(slot) {
        const itemId = State.equipment[slot];
        if (!itemId) return false;
        setState(['equipment', slot], null);
        SaveSystem.save();
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('equipment:unequipped', { slot, itemId });
            PubSub.publish('equipment:changed', State.equipment);
        }
        return true;
    },

    isEquipped(itemId) {
        return Object.values(State.equipment).includes(itemId);
    },

    getEquippedCount() {
        return Object.values(State.equipment).filter(Boolean).length;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Equipment };
}
