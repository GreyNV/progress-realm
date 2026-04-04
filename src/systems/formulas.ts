import { getLegacyRuntime } from "./runtime";

const MASTERY_WEIGHT_RATIO = 0.2;

function resolveStatFactorValue(factor: unknown, field: "speed" | "output"): number {
    if (typeof factor === "number") {
        return factor;
    }
    if (!factor || typeof factor !== "object") {
        return 0;
    }
    return Number((factor as Record<string, unknown>)[field] || 0);
}

function getCompoundingMultiplier(level: number, weight: number): number {
    const safeLevel = Math.max(0, Number(level || 0));
    const safeWeight = Math.max(0, Number(weight || 0));
    return Math.pow(1 + safeWeight, safeLevel);
}

export function createFormulaSystem() {
    return {
        getActionTier(_level: number) {
            return "normal";
        },
        scalingMultiplier(_action: any) {
            return 1;
        },
        getPrestigeValueForStat(statKey: string) {
            const runtime = getLegacyRuntime();
            const prestigeKey = runtime.PRESTIGE_MAP?.[statKey];
            if (!prestigeKey) {
                return 0;
            }
            return runtime.State.mastery?.[prestigeKey]?.level ?? runtime.State.prestige?.[prestigeKey] ?? 0;
        },
        resolveStatFactorValue,
        getActionMultiplierBreakdown(action: any, field: "speed" | "output" = "speed") {
            const runtime = getLegacyRuntime();
            const stats = Object.entries(action?.statFactors || {}).reduce((entries: Array<Record<string, number | string>>, [statKey, factor]) => {
                const weight = resolveStatFactorValue(factor, field);
                if (weight <= 0) {
                    return entries;
                }
                const currentLevel = runtime.getStatLevel ? runtime.getStatLevel(statKey) : 0;
                const masteryLevel = this.getPrestigeValueForStat(statKey);
                const upgradeMultiplier = (globalThis as any).RoutineUpgradeSystem?.getMultiplierForStat?.(statKey) || 1;
                const currentMultiplier = getCompoundingMultiplier(currentLevel, weight);
                const masteryMultiplier = getCompoundingMultiplier(masteryLevel, weight * MASTERY_WEIGHT_RATIO);
                entries.push({
                    statKey,
                    weight,
                    currentLevel,
                    masteryLevel,
                    upgradeMultiplier,
                    currentMultiplier,
                    masteryMultiplier,
                    totalMultiplier: currentMultiplier * masteryMultiplier * upgradeMultiplier
                });
                return entries;
            }, []);

            const currentMultiplier = stats.reduce((total, entry) => total * Number(entry.currentMultiplier || 1), 1);
            const masteryMultiplier = stats.reduce((total, entry) => total * Number(entry.masteryMultiplier || 1), 1);
            const upgradesMultiplier = stats.reduce((total, entry) => total * Number(entry.upgradeMultiplier || 1), 1);
            return {
                field,
                currentMultiplier,
                masteryMultiplier,
                upgradesMultiplier,
                totalMultiplier: currentMultiplier * masteryMultiplier * upgradesMultiplier,
                stats
            };
        },
        getWeightedStatContribution(factors: Record<string, unknown> = {}, field: "speed" | "output") {
            const runtime = getLegacyRuntime();
            return Object.entries(factors).reduce((total, [statKey, factor]) => {
                const weight = resolveStatFactorValue(factor, field);
                const level = runtime.getStatLevel ? runtime.getStatLevel(statKey) : 0;
                const prestige = this.getPrestigeValueForStat(statKey);
                return total + (level * weight) + (prestige * weight * 0.35);
            }, 0);
        },
        getActionSpeedMultiplier(action: any) {
            return this.getActionMultiplierBreakdown(action, "speed").totalMultiplier;
        },
        getActionOutputMultiplier(action: any) {
            return this.getActionMultiplierBreakdown(action, "output").totalMultiplier;
        },
        getActionStatOnlyMultiplier(action: any) {
            return this.getActionSpeedMultiplier(action);
        },
        getEncounterSpeedMultiplier(encounter: any) {
            const factors = { ...(encounter.statFactors || {}) };
            if (!Object.keys(factors).length && encounter.category) {
                factors[encounter.category] = { speed: 0.06, output: 0.04 };
            }
            return 1 + this.getWeightedStatContribution(factors, "speed");
        },
        getEncounterOutputMultiplier(encounter: any) {
            const factors = { ...(encounter.statFactors || {}) };
            if (!Object.keys(factors).length && encounter.category) {
                factors[encounter.category] = { speed: 0.06, output: 0.04 };
            }
            return 1 + this.getWeightedStatContribution(factors, "output");
        },
        getEncounterStatOnlyMultiplier(encounter: any) {
            return this.getEncounterSpeedMultiplier(encounter) * this.getEncounterOutputMultiplier(encounter);
        },
        canAfford(cost: Record<string, number>, delta: number, mult = 1) {
            const runtime = getLegacyRuntime();
            for (const key in cost) {
                const amount = cost[key] * mult * runtime.State.time * delta;
                const resource = runtime.State.resources[key];
                if (!resource || resource.value < amount) {
                    return key;
                }
            }
            return null;
        },
        applyYield(base: any, mult: number, delta: number) {
            const runtime = getLegacyRuntime();
            if (base.stats) {
                for (const stat in base.stats) {
                    runtime.StatSystem?.add(runtime.State.stats[stat], base.stats[stat] * mult * runtime.State.time * delta);
                }
            }
            if (base.resources) {
                for (const resource in base.resources) {
                    runtime.ResourceSystem?.add(runtime.State.resources[resource], base.resources[resource] * mult * runtime.State.time * delta);
                }
            }
        },
        gainExp(_action: any, _amount: number) {
            return;
        }
    };
}
