// Agents: Utility methods shared across systems. Keep this lightweight and
// free of game state so it can be safely imported anywhere.
const Utils = {
    /**
     * Select an item using weighted random choice.
     * @param {Array} items - list of possible items
     * @param {Array<number>} weights - corresponding weights
     * @returns selected item
     */
    weightedRandomChoice(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    },

    /**
     * Format a cost object into a readable string.
     * @param {Object} cost
     * @returns {string}
     */
    formatCost(cost = {}) {
        return Object.entries(cost)
            .map(([id, qty]) => {
                const item = typeof ItemGenerator !== 'undefined' && ItemGenerator.itemList
                    ? ItemGenerator.itemList.find(i => i.id === id)
                    : null;
                const name = item ? item.name : id;
                return `${qty}x ${name}`;
            })
            .join(', ');
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Utils };
}
