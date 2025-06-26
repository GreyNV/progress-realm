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
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Utils };
}
