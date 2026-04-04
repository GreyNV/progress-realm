// Compatibility shim. The browser runtime installs `Utils`, `capitalize`, and `formatDelta` from `src/core`.
const Utils = globalThis.Utils || {
    weightedRandomChoice(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    },
    formatCost(cost = {}) {
        return Object.entries(cost)
            .map(([id, qty]) => `${qty}x ${id}`)
            .join(', ');
    },
    allResourcesFull() {
        return RESOURCE_KEYS.every(k => {
            const res = State.resources[k];
            return res && res.value >= ResourceSystem.max(res);
        });
    }
};

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.capitalize === 'function' && globalThis.capitalize !== capitalize) {
        return globalThis.capitalize(str);
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a delta value with sign and one decimal place.
 * @param {number} v
 * @returns {string}
 */
function formatDelta(v) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.formatDelta === 'function' && globalThis.formatDelta !== formatDelta) {
        return globalThis.formatDelta(v);
    }
    const sign = v > 0 ? '+' : '';
    return sign + v.toFixed(1);
}

if (typeof module !== 'undefined') {
    module.exports = { Utils, capitalize, formatDelta };
}
