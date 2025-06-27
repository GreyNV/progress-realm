/**
 * Lightweight logger for debugging purposes.
 * Agents can enable verbose output by setting `Logger.enabled = true`.
 * Console methods are used so disabling has minimal performance impact.
 */
const Logger = {
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

