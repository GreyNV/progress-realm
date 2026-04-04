export interface SaveEnvelope {
    version: number;
    state: Record<string, unknown>;
    actions?: Record<string, unknown>;
    meta?: Record<string, unknown>;
}

export const LATEST_SAVE_VERSION = 3;

function toEnvelope(raw: unknown): SaveEnvelope | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const value = raw as Record<string, unknown>;
    if (value.version === undefined) {
        return {
            version: 1,
            state: value.state && typeof value.state === "object" ? (value.state as Record<string, unknown>) : value,
            actions: value.actions && typeof value.actions === "object" ? (value.actions as Record<string, unknown>) : {}
        };
    }
    if (typeof value.version !== "number") {
        return null;
    }
    return {
        version: value.version,
        state: value.state && typeof value.state === "object" ? (value.state as Record<string, unknown>) : {},
        actions: value.actions && typeof value.actions === "object" ? (value.actions as Record<string, unknown>) : {},
        meta: value.meta && typeof value.meta === "object" ? (value.meta as Record<string, unknown>) : undefined
    };
}

function migrateV1ToV2(save: SaveEnvelope): SaveEnvelope {
    return {
        version: 2,
        state: { ...save.state },
        actions: save.actions || {},
        meta: { migratedFrom: 1 }
    };
}

function migrateV2ToV3(save: SaveEnvelope): SaveEnvelope {
    return {
        version: 3,
        state: { ...save.state, version: 3 },
        actions: save.actions || {},
        meta: {
            ...(save.meta || {}),
            migratedFrom: save.version
        }
    };
}

function migrateEnvelope(save: SaveEnvelope): SaveEnvelope | null {
    if (save.version > LATEST_SAVE_VERSION) {
        return null;
    }
    let current = save;
    while (current.version < LATEST_SAVE_VERSION) {
        if (current.version === 1) {
            current = migrateV1ToV2(current);
            continue;
        }
        if (current.version === 2) {
            current = migrateV2ToV3(current);
            continue;
        }
        return null;
    }
    return current;
}

export const saveMigrationService = {
    latestVersion: LATEST_SAVE_VERSION,
    createEnvelope(state: Record<string, unknown>, actions: Record<string, unknown>): SaveEnvelope {
        return {
            version: LATEST_SAVE_VERSION,
            state,
            actions
        };
    },
    parse(raw: string): SaveEnvelope | null {
        try {
            return toEnvelope(JSON.parse(raw));
        } catch (_error) {
            return null;
        }
    },
    migrate(raw: unknown): SaveEnvelope | null {
        const envelope = typeof raw === "string" ? this.parse(raw) : toEnvelope(raw);
        if (!envelope) {
            return null;
        }
        return migrateEnvelope(envelope);
    }
};
