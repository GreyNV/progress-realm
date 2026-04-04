// Compatibility shim. The browser runtime installs `Logger` from `src/core`.
const Logger = globalThis.Logger || {
    enabled: false,
    debug(...args) {
        if (this.enabled) console.debug('[DEBUG]', ...args);
    },
    info(...args) {
        if (this.enabled) console.info('[INFO]', ...args);
    },
    warn(...args) {
        if (this.enabled) console.warn('[WARN]', ...args);
    },
    error(...args) {
        console.error('[ERROR]', ...args);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Logger };
}

