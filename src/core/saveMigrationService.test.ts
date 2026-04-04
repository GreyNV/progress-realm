import { describe, expect, it } from "vitest";
import { saveMigrationService } from "./saveMigrationService";

describe("save migration service", () => {
    it("migrates a version 2 save to latest", () => {
        const migrated = saveMigrationService.migrate({
            version: 2,
            state: { foo: "bar" },
            actions: { training: { level: 1 } }
        });
        expect(migrated?.version).toBe(saveMigrationService.latestVersion);
        expect(migrated?.state.version).toBe(saveMigrationService.latestVersion);
    });

    it("rejects future versions", () => {
        const migrated = saveMigrationService.migrate({
            version: 99,
            state: {}
        });
        expect(migrated).toBeNull();
    });
});
