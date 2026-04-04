export const Logger = {
    enabled: false,
    debug(...args: unknown[]) {
        if (this.enabled) console.debug("[DEBUG]", ...args);
    },
    info(...args: unknown[]) {
        if (this.enabled) console.info("[INFO]", ...args);
    },
    warn(...args: unknown[]) {
        if (this.enabled) console.warn("[WARN]", ...args);
    },
    error(...args: unknown[]) {
        console.error("[ERROR]", ...args);
    }
};

export function installLoggerGlobals(): void {
    (globalThis as any).Logger = Logger;
}
