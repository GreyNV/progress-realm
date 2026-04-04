import { getLegacyRuntime } from "./runtime";

export const BonusEngine = {
    statAdditions: {} as Record<string, number>,
    statMultipliers: {} as Record<string, number>,
    statPowers: {} as Record<string, number>,
    resourceAdditions: {} as Record<string, number>,
    resourceMultipliers: {} as Record<string, number>,
    resourceDividers: {} as Record<string, number>,
    initialize(statKeys: string[] = [], resourceKeys: string[] = []) {
        this.statAdditions = {}; this.statMultipliers = {}; this.statPowers = {};
        statKeys.forEach((key) => { this.statAdditions[key] = 0; this.statMultipliers[key] = 1; this.statPowers[key] = 1; });
        this.resourceAdditions = {}; this.resourceMultipliers = {}; this.resourceDividers = {};
        resourceKeys.forEach((key) => { this.resourceAdditions[key] = 0; this.resourceMultipliers[key] = 1; this.resourceDividers[key] = 1; });
    },
    applyStat(delta: number, key: string) { return Math.pow((delta + (this.statAdditions[key] || 0)) * (this.statMultipliers[key] || 1), this.statPowers[key] || 1); },
    applyResource(delta: number, key: string) { const result = (delta + (this.resourceAdditions[key] || 0)) * (this.resourceMultipliers[key] || 1); return result < 0 ? result / (this.resourceDividers[key] || 1) : result; }
};

export const AgeSystem = {
    daysPerYear: 365,
    addDays(days: number) {
        const runtime = getLegacyRuntime();
        runtime.updateState(["age", "days"], (value: number) => value + days);
        if (runtime.State.age.days >= this.daysPerYear) {
            runtime.updateState(["age", "years"], (value: number) => value + Math.floor(runtime.State.age.days / this.daysPerYear));
            runtime.setState(["age", "days"], runtime.State.age.days % this.daysPerYear);
        }
        runtime.PubSub?.publish("age:advanced", days);
        if (!runtime.State.prestiging && runtime.State.age.years >= runtime.State.age.max) runtime.PubSub?.publish("age:maxReached");
    }
};

export const Equipment = {
    equip(itemId: string, slot?: string) {
        const runtime = getLegacyRuntime();
        if (!runtime.State.inventory[itemId]) return false;
        const item = (globalThis as any).ItemGenerator?.itemList?.find((entry: any) => entry.id === itemId);
        if (!item || item.type !== "equipment" || !item.slot) return false;
        if (slot && slot !== item.slot) return false;
        const targetSlot = item.slot;
        const previousItemId = runtime.State.equipment[targetSlot];
        if (previousItemId === itemId) return true;
        runtime.setState(["equipment", targetSlot], itemId);
        runtime.SaveSystem?.save();
        if (previousItemId) runtime.PubSub?.publish("equipment:unequipped", { slot: targetSlot, itemId: previousItemId });
        runtime.PubSub?.publish("equipment:equipped", { slot: targetSlot, itemId });
        runtime.PubSub?.publish("equipment:changed", runtime.State.equipment);
        return true;
    },
    unequip(slot: string) {
        const runtime = getLegacyRuntime();
        const itemId = runtime.State.equipment[slot];
        if (!itemId) return false;
        runtime.setState(["equipment", slot], null);
        runtime.SaveSystem?.save();
        runtime.PubSub?.publish("equipment:unequipped", { slot, itemId });
        runtime.PubSub?.publish("equipment:changed", runtime.State.equipment);
        return true;
    },
    isEquipped(itemId: string) { return Object.values(getLegacyRuntime().State.equipment).includes(itemId); },
    getEquippedCount() { return Object.values(getLegacyRuntime().State.equipment).filter(Boolean).length; }
};

export const QueueResourceHelper = {
    resolveQueueResourceCap(name: string) {
        const runtime = getLegacyRuntime() as any;
        const res = runtime.State?.resources?.[name];
        if (!res) return undefined;
        const cap = runtime.SoftCapSystem?.getResourceCap?.(name);
        if (cap !== undefined && cap !== null) return cap;
        if (runtime.ResourceSystem?.max) return runtime.ResourceSystem.max(res);
        return res.baseMax;
    },
    resourceAtQueueThreshold(name: string, explicitThreshold?: number) {
        const runtime = getLegacyRuntime() as any;
        const res = runtime.State?.resources?.[name];
        if (!res || typeof res.value !== "number") return false;
        if (typeof explicitThreshold === "number" && !Number.isNaN(explicitThreshold)) return res.value >= explicitThreshold;
        const cap = this.resolveQueueResourceCap(name);
        if (cap === undefined || cap === null) return res.value > 0;
        return res.value >= cap;
    }
};

export const SoftCapSystem = {
    baseStatCaps: { strength: 50, intelligence: 50, agility: 50, constitution: 50, will: 50 } as Record<string, number>,
    baseResourceCaps: {} as Record<string, number>,
    statCaps: {} as Record<string, number>,
    resourceCaps: {} as Record<string, number>,
    falloff: 0.5,
    recalculateCaps(inventory: Record<string, any>) {
        const runtime = getLegacyRuntime() as any;
        this.statCaps = { ...this.baseStatCaps };
        this.resourceCaps = { ...this.baseResourceCaps };
        if (!inventory) return;
        Object.entries(inventory).forEach(([id, record]: [string, any]) => {
            const item = (globalThis as any).ItemGenerator?.itemList?.find((entry: any) => entry.id === id);
            if (!item || item.effectType !== "increaseSoftcap") return;
            const quantity = record.quantity || 0;
            Object.keys(item.effectValue || {}).forEach((key) => {
                const value = item.effectValue[key] * Math.log(quantity + 1);
                if (this.statCaps[key] !== undefined) this.statCaps[key] += value;
                else this.resourceCaps[key] = (this.resourceCaps[key] || (this.baseResourceCaps[key] || 0)) + value;
            });
        });
        Object.keys(this.resourceCaps).forEach((key) => { if (runtime.State.resources[key]) runtime.setState(["resources", key, "baseMax"], this.resourceCaps[key]); });
        Object.keys(this.statCaps).forEach((key) => {
            if (runtime.State.stats[key]) {
                runtime.setState(["stats", key, "baseMax"], this.statCaps[key]);
                this.statCaps[key] = runtime.StatSystem.max(runtime.State.stats[key]);
            }
        });
    },
    apply() {
        const runtime = getLegacyRuntime() as any;
        Object.keys(this.statCaps).forEach((key) => {
            const cap = this.statCaps[key];
            const value = runtime.getStatValue(key);
            if (value > cap) runtime.setStatValue(key, cap + (value - cap) * this.falloff);
        });
        Object.keys(this.resourceCaps).forEach((key) => {
            const cap = this.resourceCaps[key];
            const value = runtime.getResourceValue(key);
            if (value > cap) runtime.setResourceValue(key, cap + (value - cap) * this.falloff);
        });
        this.refreshCaps();
    },
    refreshCaps() {
        const runtime = getLegacyRuntime() as any;
        Object.keys(runtime.State.resources || {}).forEach((name) => { this.resourceCaps[name] = runtime.ResourceSystem.max(runtime.State.resources[name]); });
        Object.keys(runtime.State.stats || {}).forEach((name) => { this.statCaps[name] = runtime.StatSystem.max(runtime.State.stats[name]); });
    },
    getResourceCap(name: string) {
        const runtime = getLegacyRuntime() as any;
        if (!name) return undefined;
        if (this.resourceCaps[name] === undefined && runtime.State.resources[name]) this.resourceCaps[name] = runtime.ResourceSystem.max(runtime.State.resources[name]);
        return this.resourceCaps[name];
    },
    getStatCap(name: string) {
        const runtime = getLegacyRuntime() as any;
        if (!name) return undefined;
        if (this.statCaps[name] === undefined && runtime.State.stats[name]) this.statCaps[name] = runtime.StatSystem.max(runtime.State.stats[name]);
        return this.statCaps[name];
    },
    bumpStatCap(name: string, multiplier: number) {
        const runtime = getLegacyRuntime() as any;
        if (!name || !runtime.State.stats[name]) return;
        const numeric = Number(multiplier);
        const baseMax = this.baseStatCaps[name] !== undefined ? this.baseStatCaps[name] : runtime.State.stats[name].baseMax;
        runtime.setState(["stats", name, "baseMax"], Number.isFinite(numeric) && numeric > 0 ? baseMax * numeric : baseMax);
        this.refreshCaps();
    }
};

function getCombatStatLevel(name: string) {
    const runtime = getLegacyRuntime() as any;
    if (typeof runtime.getStatLevel === "function") return runtime.getStatLevel(name);
    if (typeof runtime.getStatValue === "function") return runtime.getStatValue(name);
    return runtime.State.stats?.[name]?.level || runtime.State.stats?.[name]?.value || 0;
}

function getCombatPrestigeValue(key: string) {
    const runtime = getLegacyRuntime() as any;
    return runtime.State.prestige?.[key] || 0;
}

export const CombatEngine = {
    basePlayerSprite: "assets/char/new_char.png",
    isActive() { return !!getLegacyRuntime().State.combat.active; },
    getEquipmentItem(slot: string) {
        const runtime = getLegacyRuntime() as any;
        const itemId = runtime.State.equipment[slot];
        if (!itemId) return null;
        return (globalThis as any).ItemGenerator?.itemList?.find((item: any) => item.id === itemId) || null;
    },
    getPlayerSprite() { return (globalThis as any).CharacterBackground?.getImage?.() || this.basePlayerSprite; },
    derivePlayerStats(encounter: any) {
        const runtime = getLegacyRuntime() as any;
        const weapon = this.getEquipmentItem("rightHand");
        const shield = this.getEquipmentItem("leftHand");
        const equippedItems = Object.values(runtime.State.equipment).filter(Boolean).map((id) => (globalThis as any).ItemGenerator?.itemList?.find((item: any) => item.id === id)).filter(Boolean);
        const stats: any = { maxHp: 18 + getCombatStatLevel("strength") * 1.5 + getCombatStatLevel("constitution") * 1.5, hp: 0, attack: 2 + getCombatStatLevel("strength") * 0.7 + getCombatStatLevel("agility") * 0.3 + getCombatPrestigeValue("constitution") * 0.18, defense: 1 + getCombatStatLevel("constitution") * 0.18 + getCombatPrestigeValue("vigor") * 0.08, speed: 0.8 + getCombatStatLevel("agility") * 0.04 + getCombatStatLevel("intelligence") * 0.01 + getCombatPrestigeValue("reflexes") * 0.012, critChance: 0.05 + getCombatStatLevel("agility") * 0.004 + getCombatPrestigeValue("reflexes") * 0.001, critDamage: 1.5, blockChance: 0, blockValue: 0, sprite: this.getPlayerSprite(), name: runtime.Lang?.ui("Traveler") || "Traveler", weaponName: weapon ? weapon.name : (runtime.Lang?.ui("Unarmed") || "Unarmed"), shieldName: shield ? shield.name : (runtime.Lang?.ui("No Shield") || "No Shield") };
        stats.hp = stats.maxHp;
        equippedItems.forEach((item: any) => { Object.entries(item.combatBonuses || {}).forEach(([key, value]) => { if (stats[key] === undefined) stats[key] = 0; stats[key] += Number(value); }); });
        if (weapon?.weaponProfile) { stats.attack += weapon.weaponProfile.baseAttack || 0; stats.speed *= weapon.weaponProfile.speed || 1; stats.critChance += weapon.weaponProfile.critChance || 0; if (weapon.weaponProfile.critDamage) stats.critDamage = Math.max(stats.critDamage, weapon.weaponProfile.critDamage); }
        if (shield?.shieldProfile) { stats.blockChance += shield.shieldProfile.blockChance || 0; stats.blockValue += shield.shieldProfile.blockValue || 0; }
        if (encounter?.category === "intelligence") stats.speed += getCombatStatLevel("intelligence") * 0.02 + getCombatPrestigeValue("wisdom") * 0.01;
        stats.maxHp = Math.round(stats.maxHp); stats.hp = stats.maxHp; stats.attack = Number(stats.attack.toFixed(2)); stats.defense = Number(stats.defense.toFixed(2)); stats.speed = Number(stats.speed.toFixed(2)); stats.critChance = Number(stats.critChance.toFixed(3));
        return stats;
    },
    deriveEnemyStats(encounter: any) { const enemy = encounter.enemy || {}; return { name: enemy.name || encounter.name, type: enemy.type || "hostile", sprite: enemy.sprite || encounter.image || "", maxHp: enemy.maxHp || 12, hp: enemy.maxHp || 12, attack: enemy.attack || 3, defense: enemy.defense || 1, speed: enemy.speed || 1, critChance: enemy.critChance || 0.04, critDamage: enemy.critDamage || 1.5 }; },
    start(encounter: any) { const runtime = getLegacyRuntime() as any; const player = this.derivePlayerStats(encounter); const enemy = this.deriveEnemyStats(encounter); runtime.setState("combat", { active: true, phase: "battle", encounterId: encounter.id, round: 1, player, enemy, log: [`${player.name} enters combat with ${enemy.name}.`, `${player.weaponName} ready${player.shieldName !== (runtime.Lang?.ui("No Shield") || "No Shield") ? `, ${player.shieldName} raised.` : "."}`], outcome: null, timeToNextTurn: 0.8 }); runtime.PubSub?.publish("combat:update", runtime.State.combat); },
    appendLog(message: string) { const runtime = getLegacyRuntime() as any; runtime.State.combat.log.push(message); if (runtime.State.combat.log.length > 8) runtime.State.combat.log.shift(); },
    rollAttack(attacker: any, defender: any, isPlayer: boolean) { const runtime = getLegacyRuntime() as any; let damage = Math.max(1, attacker.attack - defender.defense * 0.5); let blocked = false; if (!isPlayer && Math.random() < (runtime.State.combat.player.blockChance || 0)) { damage = Math.max(0, damage - (runtime.State.combat.player.blockValue || 0)); blocked = true; } const crit = Math.random() < (attacker.critChance || 0); if (crit) damage *= attacker.critDamage || 1.5; damage = Math.max(0, Math.round(damage)); defender.hp = Math.max(0, defender.hp - damage); return { damage, crit, blocked }; },
    stepRound() { const runtime = getLegacyRuntime() as any; const combat = runtime.State.combat; if (!combat.active || combat.phase !== "battle") return; [{ key: "player", speed: combat.player.speed, isPlayer: true }, { key: "enemy", speed: combat.enemy.speed, isPlayer: false }].sort((a, b) => b.speed - a.speed).forEach((actor) => { if (combat.player.hp <= 0 || combat.enemy.hp <= 0) return; const attacker = actor.isPlayer ? combat.player : combat.enemy; const defender = actor.isPlayer ? combat.enemy : combat.player; const result = this.rollAttack(attacker, defender, actor.isPlayer); let line = `${attacker.name} hits ${defender.name} for ${result.damage}.`; if (result.crit) line += " Critical strike."; if (result.blocked) line += " The blow is partially blocked."; this.appendLog(line); }); if (combat.enemy.hp <= 0) { combat.phase = "victory"; combat.outcome = "victory"; this.appendLog(`${combat.enemy.name} falls. Victory is yours.`); } else if (combat.player.hp <= 0) { combat.phase = "defeat"; combat.outcome = "defeat"; this.appendLog(`${combat.player.name} is overwhelmed and forced back.`); } else combat.round += 1; },
    tick(delta: number) { const runtime = getLegacyRuntime() as any; if (!this.isActive()) return; runtime.State.combat.timeToNextTurn -= delta * runtime.State.time; if (runtime.State.combat.timeToNextTurn > 0) return; runtime.State.combat.timeToNextTurn = 0.8; this.stepRound(); runtime.PubSub?.publish("combat:update", runtime.State.combat); },
    finishVictory() { const runtime = getLegacyRuntime() as any; const encounterId = runtime.State.combat.encounterId; this.clear(); return encounterId; },
    clear() { const runtime = getLegacyRuntime() as any; runtime.setState("combat", runtime.createDefaultCombatState()); runtime.PubSub?.publish("combat:update", runtime.State.combat); }
};

export function applyPrestigeBonuses() {
    const scope = globalThis as any;
    (scope.STAT_KEYS || []).forEach((key: string) => {
        if (scope.BonusEngine) {
            scope.BonusEngine.statMultipliers[key] = 1;
        }
    });
}

export function installSupportGlobals() {
    const scope = globalThis as any;
    Object.assign(scope, {
        BonusEngine,
        AgeSystem,
        Equipment,
        SoftCapSystem,
        CombatEngine,
        applyPrestigeBonuses,
        QueueResourceHelper,
        resolveQueueResourceCap: QueueResourceHelper.resolveQueueResourceCap.bind(QueueResourceHelper),
        resourceAtQueueThreshold: QueueResourceHelper.resourceAtQueueThreshold.bind(QueueResourceHelper)
    });
}
