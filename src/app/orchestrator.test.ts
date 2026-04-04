import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPersistenceHooks, startAutoSaveLoop, appOrchestrator } from "./orchestrator";

describe("orchestrator persistence hooks", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const scope = globalThis as any;
        scope.SaveSystem = {
            save: vi.fn()
        };
        scope.addEventListener = vi.fn();
        scope.document = {
            visibilityState: "visible",
            addEventListener: vi.fn()
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("autosaves on a timer", () => {
        const scope = globalThis as any;

        startAutoSaveLoop();
        vi.advanceTimersByTime(appOrchestrator.AUTOSAVE_MS);

        expect(scope.SaveSystem.save).toHaveBeenCalledTimes(1);
    });

    it("saves when the page is hidden", () => {
        const scope = globalThis as any;
        scope.document.visibilityState = "hidden";

        registerPersistenceHooks();
        const handler = scope.document.addEventListener.mock.calls.find(([eventName]: [string]) => eventName === "visibilitychange")?.[1] as EventListener;
        handler(new Event("visibilitychange"));

        expect(scope.SaveSystem.save).toHaveBeenCalledTimes(1);
    });
});
