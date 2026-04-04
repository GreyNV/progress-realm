import { describe, expect, it } from "vitest";
import { formatDelta } from "./utils";

describe("formatDelta", () => {
    it("formats missing values safely during bootstrap", () => {
        expect(formatDelta(undefined as unknown as number)).toBe("0.0");
        expect(formatDelta(null as unknown as number)).toBe("0.0");
    });

    it("preserves signs for numeric values", () => {
        expect(formatDelta(1.25)).toBe("+1.3");
        expect(formatDelta(-0.25)).toBe("-0.3");
    });
});
