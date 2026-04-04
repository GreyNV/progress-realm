import { selectRecommendedAction } from "../selectors";

function getScope(): any {
    return globalThis as any;
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createHudUi() {
    const formatMultiplier = (value: number) => `x${Number(value || 1).toFixed(2)}`;
    const STAT_ICONS: Record<string, string> = {
        strength: "S",
        intelligence: "I",
        agility: "A",
        constitution: "C",
        will: "W"
    };
    const getObjectTotal = (record: Record<string, number> = {}) => Object.values(record).reduce((sum, value) => sum + Number(value || 0), 0);
    const formatRuntime = (seconds = 0) => seconds < 60 ? `${seconds.toFixed(0)}s` : seconds < 3600 ? `${(seconds / 60).toFixed(1)}m` : `${(seconds / 3600).toFixed(1)}h`;
    const formatDungeonName = (id: string) => !id ? "frontier" : id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    const formatKeyLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    const formatXpProgress = (current = 0, target = 0) => `${Number(current || 0).toFixed(1)} / ${Number(target || 0).toFixed(1)} XP`;
    const formatEquipmentName = (itemId: string | null, fallback: string) => {
        const scope = getScope();
        if (!itemId) {
            return fallback;
        }
        const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === itemId);
        return item ? item.name : fallback;
    };
    const getStatIcon = (statKey: string) => STAT_ICONS[statKey] || statKey.charAt(0).toUpperCase();
    const getOrderedStatKeys = (statFactors: Record<string, any> = {}) =>
        Object.entries(statFactors)
            .sort((a: any, b: any) => {
                const totalA = Number(a[1]?.speed || 0) + Number(a[1]?.output || 0);
                const totalB = Number(b[1]?.speed || 0) + Number(b[1]?.output || 0);
                return totalB - totalA;
            })
            .map(([statKey]) => statKey);
    const getStatChipsHtml = (statFactors: Record<string, any> = {}, limit = 3) => {
        const scope = getScope();
        return getOrderedStatKeys(statFactors).slice(0, limit).map((statKey) => `
            <span class="stat-chip stat-chip-${statKey}">
                <span class="stat-chip-icon">${getStatIcon(statKey)}</span>
                <span class="stat-chip-label">${scope.Lang?.stat(statKey) || formatKeyLabel(statKey)}</span>
            </span>
        `).join("");
    };
    const getTopStatKey = () => {
        const scope = getScope();
        return (scope.StatsUI?.list || []).slice().sort((a: string, b: string) => {
            const levelDiff = scope.getStatLevel(b) - scope.getStatLevel(a);
            if (levelDiff !== 0) {
                return levelDiff;
            }
            return scope.getStatExp(b) - scope.getStatExp(a);
        })[0] || null;
    };
    const getAvailableActions = () => Object.values(getScope().actions || {}).filter((action: any) => action && !action.hidden && !action.locked);
    const getStatAverageMultiplier = (statKey: string) => {
        const scope = getScope();
        const samples: number[] = [];
        getAvailableActions().forEach((action: any) => {
            if (action.statFactors?.[statKey]) {
                samples.push(scope.getActionStatOnlyMultiplier(action));
            }
        });
        (scope.EncounterGenerator?.encounters || []).forEach((encounter: any) => {
            if (encounter.id !== "recover" && encounter.statFactors?.[statKey]) {
                samples.push(scope.getEncounterStatOnlyMultiplier(encounter));
            }
        });
        if (!samples.length) {
            return 1;
        }
        return samples.reduce((sum, value) => sum + value, 0) / samples.length;
    };
    const getStatLayerBreakdown = (statKey: string) => {
        const scope = getScope();
        const actionMatches = getAvailableActions()
            .filter((action: any) => action.statFactors?.[statKey])
            .map((action: any) => {
                const factor = action.statFactors?.[statKey];
                const speed = Number(scope.resolveStatFactorValue?.(factor, "speed") || factor?.speed || factor || 0);
                const masteryKey = scope.PRESTIGE_MAP?.[statKey];
                const currentLevel = scope.getStatLevel?.(statKey) || 0;
                const masteryLevel = masteryKey ? (scope.getMasteryLevel?.(masteryKey) || 0) : 0;
                return {
                    currentMultiplier: Math.pow(1 + speed, currentLevel),
                    masteryMultiplier: Math.pow(1 + (speed * 0.2), masteryLevel),
                    upgradeMultiplier: scope.RoutineUpgradeSystem?.getMultiplierForStat?.(statKey) || 1
                };
            });
        if (!actionMatches.length) {
            return {
                currentMultiplier: 1,
                masteryMultiplier: 1,
                upgradeMultiplier: scope.RoutineUpgradeSystem?.getMultiplierForStat?.(statKey) || 1
            };
        }
        const average = (key: "currentMultiplier" | "masteryMultiplier" | "upgradeMultiplier") =>
            actionMatches.reduce((sum: number, item: any) => sum + Number(item[key] || 1), 0) / actionMatches.length;
        return {
            currentMultiplier: average("currentMultiplier"),
            masteryMultiplier: average("masteryMultiplier"),
            upgradeMultiplier: average("upgradeMultiplier")
        };
    };
    const getActiveRoutineAction = () => {
        const scope = getScope();
        return scope.State.slots
            .map((slot: any) => scope.actions[slot.actionId])
            .find((action: any) => action && action.id !== scope.State.defaultActionId) || null;
    };
    const getActiveRoutineMultiplier = () => {
        const scope = getScope();
        const action = getActiveRoutineAction();
        if (!action) {
            return 1;
        }
        return scope.getActionSpeedMultiplier?.(action) || 1;
    };
    const getActiveRoutineBreakdown = () => {
        const scope = getScope();
        const action = getActiveRoutineAction();
        if (!action) {
            return null;
        }
        return {
            action,
            breakdown: scope.getActionMultiplierBreakdown?.(action, "speed") || null
        };
    };
    const getDungeonAverageMultiplier = (dungeonId: string) => {
        const scope = getScope();
        const encounters = (scope.EncounterGenerator?.encounters || []).filter((encounter: any) =>
            encounter.id !== "recover" && (encounter.dungeon || "frontier") === (dungeonId || scope.State.currentDungeon || "frontier")
        );
        if (!encounters.length) {
            return 1;
        }
        return encounters.reduce((sum: number, encounter: any) => sum + scope.getEncounterStatOnlyMultiplier(encounter), 0) / encounters.length;
    };
    const getCurrentActivityLabel = () => {
        const scope = getScope();
        const activeAction = scope.State.slots
            .map((slot: any) => scope.actions[slot.actionId])
            .find((action: any) => action && action.id !== scope.State.defaultActionId);
        return activeAction ? activeAction.name : (scope.Lang?.ui("Open Slot") || "Open Slot");
    };
    const getSelectedDungeonDefinition = () => {
        const scope = getScope();
        return scope.EncounterGenerator?.getDungeonDefinition?.(scope.State.currentDungeon || "frontier") || null;
    };
    const getActiveAdventureSlot = () => {
        const scope = getScope();
        return (scope.State.adventureSlots || []).find((slot: any) => slot?.active && slot?.encounter) || null;
    };
    const getNextDungeonUnlock = () => {
        const scope = getScope();
        const registry = scope.window?.__appContent;
        const service = scope.window?.__progressionService;
        if (!registry?.dungeons || !service?.isDungeonUnlocked) {
            return scope.Lang?.ui("No Pending Route") || "No Pending Route";
        }
        const nextLocked = registry.dungeons.find((dungeon: any) => !service.isDungeonUnlocked(dungeon.id, scope.State, registry));
        if (!nextLocked) {
            return scope.Lang?.ui("All Routes Open") || "All Routes Open";
        }
        const reason = service.getUnlockReason?.(nextLocked.id, "dungeon", scope.State, registry) || "";
        return `${nextLocked.name}${reason ? ` | ${reason}` : ""}`;
    };
    const getResearchProgressLabel = () => {
        const scope = getScope();
        if (!scope.ResearchSystem?.research?.length) {
            return "0/0";
        }
        const completed = scope.ResearchSystem.getCompletedCount
            ? scope.ResearchSystem.getCompletedCount()
            : (scope.State.researchCompleted || []).length;
        return `${completed}/${scope.ResearchSystem.research.length}`;
    };
    const getRecommendedAction = () => {
        const scope = getScope();
        if (scope.window?.__appSelectors && scope.window?.__appContent) {
            const selected = selectRecommendedAction(scope.State, scope.window.__appContent);
            if (selected?.action) {
                return selected;
            }
        }
        return null;
    };

    return {
        helpers: {
            formatMultiplier,
            getTopStatKey,
            getStatAverageMultiplier,
            getActiveRoutineMultiplier,
            getDungeonAverageMultiplier,
            getCurrentActivityLabel,
            getRecommendedAction,
            getObjectTotal,
            formatRuntime,
            formatDungeonName,
            formatEquipmentName,
            formatKeyLabel,
            formatXpProgress,
            getActiveRoutineAction,
            getActiveRoutineBreakdown,
            getActiveAdventureSlot,
            getStatIcon,
            getOrderedStatKeys,
            getStatChipsHtml,
            getStatLayerBreakdown
        },
        stats: {
            list: [] as string[],
            init() {
                this.list = (getScope().STAT_KEYS || []).filter((key: string) => key !== "charisma");
            },
            translate() {
                getScope().ResourceInspector?.translateGroup("stats", this.list);
            },
            update() {
                const scope = getScope();
                this.list.forEach((key) => {
                    const levelEl = document.getElementById(`stat-${key}-level`);
                    const expEl = document.getElementById(`stat-${key}-exp`);
                    const capEl = document.getElementById(`stat-${key}-cap`);
                    const deltaEl = document.getElementById(`stat-${key}-delta`);
                    if (levelEl) levelEl.textContent = formatMultiplier(getStatAverageMultiplier(key));
                    if (expEl) expEl.textContent = scope.getStatExp(key).toFixed(1);
                    if (capEl) capEl.textContent = scope.getStatMax(key).toFixed(1);
                    if (deltaEl) deltaEl.textContent = scope.formatDelta(scope.statDeltas[key]);
                    scope.ResourceInspector?.updateEntry("stats", key);
                });
            }
        },
        prestige: {
            list: [] as string[],
            listEl: null as HTMLElement | null,
            init() {
                const scope = getScope();
                this.list = scope.PRESTIGE_KEYS;
                this.listEl = document.getElementById("prestige-list");
                this.translate();
                this.update();
            },
            translate() {
                getScope().ResourceInspector?.translateGroup("prestige", this.list);
            },
            update() {
                const scope = getScope();
                if (!this.listEl) {
                    return;
                }
                let show = false;
                this.list.forEach((key) => {
                    const val = scope.State.prestige[key] || 0;
                    const stat = Object.keys(scope.PRESTIGE_MAP).find((entry) => scope.PRESTIGE_MAP[entry] === key);
                    const gain = stat ? Math.floor((scope.State.stats[stat].level || scope.State.stats[stat].value || 0) / 10) : 0;
                    const el = document.getElementById(`prestige-${key}`);
                    const gainEl = document.getElementById(`prestige-${key}-gain`);
                    if (el) el.textContent = String(val);
                    if (gainEl) gainEl.textContent = `(+${gain})`;
                    scope.ResourceInspector?.updateEntry("prestige", key);
                    if (val > 0) {
                        show = true;
                    }
                });
                const section = this.listEl.closest("section") as HTMLElement | null;
                if (section) {
                    section.style.display = show ? "block" : "none";
                }
            }
        },
        resources: {
            list: [] as string[],
            init() {
                this.list = (getScope().RESOURCE_KEYS || []).slice();
            },
            translate() {
                getScope().ResourceInspector?.translateGroup("resources", this.list);
            },
            update() {
                const scope = getScope();
                this.list.forEach((key) => scope.ResourceInspector?.updateEntry("resources", key));
            }
        },
        telemetry: {
            metrics: [
                { id: "top-stat", label: "Lead Stat" },
                { id: "routine-multiplier", label: "Routine Pace" },
                { id: "adventure-unlock", label: "Adventure Unlock" },
                { id: "next-layer", label: "Next Layer" }
            ],
            build() {
                const scope = getScope();
                const container = document.getElementById("progress-telemetry-list");
                if (!container) {
                    return;
                }
                container.innerHTML = "";
                this.metrics.forEach((metric: any) => {
                    const article = document.createElement("article");
                    article.className = "signal-card telemetry-card";
                    article.innerHTML = `<span class="signal-label" id="telemetry-label-${metric.id}">${scope.Lang?.ui(metric.label) || metric.label}</span><strong id="telemetry-value-${metric.id}">0</strong>`;
                    container.appendChild(article);
                });
            },
            update() {
                const scope = getScope();
                const topStat = getTopStatKey();
                const values: Record<string, string | number> = {
                    "top-stat": topStat ? `${scope.Lang?.stat(topStat) || capitalize(topStat)} ${formatMultiplier(getStatAverageMultiplier(topStat))}` : (scope.Lang?.ui("Untrained") || "Untrained"),
                    "routine-multiplier": formatMultiplier(getActiveRoutineMultiplier()),
                    "adventure-unlock": scope.window?.__appSelectors && scope.window?.__appContent
                        ? scope.window.__appSelectors.selectDashboardState(scope.State, scope.window.__appContent).adventureUnlockLabel
                        : (scope.Lang?.ui("Locked") || "Locked"),
                    "next-layer": scope.TabManager.isTabVisible("adventure")
                        ? (scope.Lang?.ui("Belongings after first clear") || "Belongings after first clear")
                        : (scope.Lang?.ui("Adventure") || "Adventure")
                };
                Object.entries(values).forEach(([id, value]) => {
                    const node = document.getElementById(`telemetry-value-${id}`);
                    if (node) {
                        node.textContent = String(value);
                    }
                });
            }
        },
        trends: {
            maxPoints: 32,
            history: {} as Record<string, number[]>,
            buildPath(history: number[]) {
                if (!history.length) {
                    return "";
                }
                if (history.length === 1) {
                    const y = (1 - history[0]) * 36 + 2;
                    return `M 0 ${y} L 120 ${y}`;
                }
                const step = 120 / Math.max(history.length - 1, 1);
                return history.map((point, index) => {
                    const x = Number((step * index).toFixed(2));
                    const y = Number((((1 - point) * 36) + 2).toFixed(2));
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ");
            },
            build() {
                const scope = getScope();
                const container = document.getElementById("resource-chart-list");
                if (!container) {
                    return;
                }
                container.innerHTML = "";
                (scope.StatsUI?.list || []).forEach((key: string) => {
                    this.history[key] = [];
                    const row = document.createElement("article");
                    row.className = "resource-chart-row";
                    row.dataset.key = key;
                    row.innerHTML = `<div class="resource-chart-header"><div><p class="resource-chart-label" id="chart-label-${key}">${scope.Lang?.stat(key) || capitalize(key)}</p><strong id="chart-value-${key}">x1.00 | 0.0 / 0.0 XP</strong></div><span id="chart-delta-${key}" class="delta">0.0/s</span></div><svg id="chart-svg-${key}" class="resource-chart-svg" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path id="chart-path-${key}" class="resource-chart-path"></path></svg>`;
                    container.appendChild(row);
                });
            },
            translate() {
                const scope = getScope();
                (scope.StatsUI?.list || []).forEach((key: string) => {
                    const label = document.getElementById(`chart-label-${key}`);
                    if (label) {
                        label.textContent = scope.Lang?.stat(key) || capitalize(key);
                    }
                });
            },
            update() {
                const scope = getScope();
                (scope.StatsUI?.list || []).forEach((key: string) => {
                    const multiplier = getStatAverageMultiplier(key);
                    const value = scope.getStatExp(key);
                    const cap = scope.getStatMax(key);
                    const history = this.history[key] || (this.history[key] = []);
                    const ratio = cap > 0 ? Math.max(0, Math.min(1, value / cap)) : 0;
                    history.push(ratio);
                    if (history.length > this.maxPoints) {
                        history.shift();
                    }
                    const valueEl = document.getElementById(`chart-value-${key}`);
                    const deltaEl = document.getElementById(`chart-delta-${key}`);
                    const pathEl = document.getElementById(`chart-path-${key}`);
                    if (valueEl) valueEl.textContent = `${formatMultiplier(multiplier)} | ${value.toFixed(1)} / ${cap.toFixed(1)} XP`;
                    if (deltaEl) deltaEl.textContent = `${scope.formatDelta(scope.statDeltas[key])}/s`;
                    if (pathEl) pathEl.setAttribute("d", this.buildPath(history));
                });
            }
        },
        mastery: {
            init() { return; },
            update() { return; }
        },
        overview: {
            init() {
                this.update();
            },
            updateHero() {
                const scope = getScope();
                const hero = scope.window?.__uiModules?.dashboard?.getHeroState?.() || null;
                const routineMultiplier = document.getElementById("overview-routine-multiplier");
                const upgradesMultiplier = document.getElementById("overview-upgrades-multiplier");
                const openSlots = document.getElementById("overview-open-slots");

                if (routineMultiplier) routineMultiplier.textContent = formatMultiplier(hero ? hero.routineMultiplier : getActiveRoutineMultiplier());
                if (upgradesMultiplier) upgradesMultiplier.textContent = formatMultiplier(hero ? hero.upgradesMultiplier : (scope.getActiveRoutineBreakdown?.()?.breakdown?.upgradesMultiplier || 1));
                if (openSlots) {
                    openSlots.textContent = String(hero ? hero.openSlots : scope.State.slots.filter((slot: any) => slot.actionId === scope.State.defaultActionId).length);
                }
            },
            update() {
                const scope = getScope();
                this.updateHero();
                scope.WorkspaceDetailUI?.update();
                scope.UIHandler.refreshWorkspace();
            }
        },
        workspaceDetail: {
            renderRoutineInsights(containerId: string) {
                const scope = getScope();
                const container = document.getElementById(containerId);
                if (!container) {
                    return;
                }

                const routineState = getActiveRoutineBreakdown();
                if (!routineState?.action || !routineState.breakdown) {
                    container.innerHTML = "";
                    const emptyCard = document.createElement("article");
                    emptyCard.className = "info-card routine-breakdown-card routine-breakdown-card-empty";
                    emptyCard.innerHTML = `
                        <span class="metric-label">${scope.Lang?.ui("Routine Multiplier") || "Routine Multiplier"}</span>
                        <strong>${formatMultiplier(1)}</strong>
                        <p class="info-note">${scope.Lang?.ui("Assign a routine to inspect its current speed breakdown") || "Assign a routine to inspect its current speed breakdown"}</p>
                    `;
                    container.appendChild(emptyCard);
                    return;
                }

                const { action, breakdown } = routineState;
                const activeSlot = scope.State.slots.find((slot: any) => slot.actionId === action.id) || scope.State.slots[0] || null;
                const currentProgressRatios = breakdown.stats.map((entry: any) => {
                    const statExp = scope.getStatExp?.(entry.statKey) || 0;
                    const statMax = scope.getStatMax?.(entry.statKey) || 0;
                    return statMax > 0 ? Math.max(0, Math.min(1, statExp / statMax)) : 0;
                });
                const masteryProgressRatios = breakdown.stats.map((entry: any) => {
                    const masteryKey = scope.PRESTIGE_MAP?.[entry.statKey];
                    const masteryXp = masteryKey ? (scope.getMasteryExp?.(masteryKey) || 0) : 0;
                    const masteryCap = masteryKey ? (scope.getMasteryMax?.(masteryKey) || 0) : 0;
                    return masteryCap > 0 ? Math.max(0, Math.min(1, masteryXp / masteryCap)) : 0;
                });
                const averageProgress = currentProgressRatios.length
                    ? currentProgressRatios.reduce((sum: number, value: number) => sum + value, 0) / currentProgressRatios.length
                    : 0;
                const averageMasteryProgress = masteryProgressRatios.length
                    ? masteryProgressRatios.reduce((sum: number, value: number) => sum + value, 0) / masteryProgressRatios.length
                    : 0;
                const upgradeEntries = breakdown.stats.filter((entry: any) => Number(entry.upgradeMultiplier || 1) > 1);
                const slotProgress = Math.max(0, Math.min(1, Number(activeSlot?.progress || 0)));
                const slotRemaining = Math.max(0, Number(action.baseDuration || 10) / Math.max(Number(scope.getActionSpeedMultiplier?.(action) || 1), 0.2) * (1 - slotProgress));
                const renderLines = (bucket: "currentMultiplier" | "masteryMultiplier", levelKey: "currentLevel" | "masteryLevel", lineClass: string) => {
                    return breakdown.stats.map((entry: any) => {
                        const statName = scope.Lang?.stat(entry.statKey) || formatKeyLabel(entry.statKey);
                        const masteryKey = scope.PRESTIGE_MAP?.[entry.statKey];
                        const masteryName = masteryKey ? (scope.Lang?.ui?.(masteryKey) || formatKeyLabel(masteryKey)) : statName;
                        const label = bucket === "currentMultiplier" ? statName : masteryName;
                        const currentXp = scope.getStatExp?.(entry.statKey) || 0;
                        const currentCap = scope.getStatMax?.(entry.statKey) || 0;
                        const masteryXp = masteryKey ? (scope.getMasteryExp?.(masteryKey) || 0) : 0;
                        const masteryCap = masteryKey ? (scope.getMasteryMax?.(masteryKey) || 0) : 0;
                        const progressRatio = currentCap > 0 ? Math.max(0, Math.min(1, currentXp / currentCap)) : 0;
                        const masteryRatio = masteryCap > 0 ? Math.max(0, Math.min(1, masteryXp / masteryCap)) : 0;
                        const progressMarkup = bucket === "currentMultiplier"
                            ? `
                                <div class="routine-breakdown-progress">
                                    <span class="routine-breakdown-progress-fill" style="width:${(progressRatio * 100).toFixed(2)}%"></span>
                                </div>
                                <span class="routine-breakdown-progress-text">${formatXpProgress(currentXp, currentCap)}</span>
                            `
                            : `
                                <div class="routine-breakdown-progress routine-breakdown-progress-mastery">
                                    <span class="routine-breakdown-progress-fill routine-breakdown-progress-fill-mastery" style="width:${(masteryRatio * 100).toFixed(2)}%"></span>
                                </div>
                                <span class="routine-breakdown-progress-text">${formatXpProgress(masteryXp, masteryCap)}</span>
                            `;
                        return `
                            <div class="routine-breakdown-line ${lineClass}">
                                <div class="routine-breakdown-line-bg">
                                    ${bucket === "currentMultiplier"
                                        ? `<span class="routine-breakdown-line-fill" style="width:${(progressRatio * 100).toFixed(2)}%"></span>`
                                        : `<span class="routine-breakdown-line-fill routine-breakdown-line-fill-mastery" style="width:${(masteryRatio * 100).toFixed(2)}%"></span>`}
                                </div>
                                <span>${label} Lv.${entry[levelKey]}</span>
                                <strong>${formatMultiplier(entry[bucket])}</strong>
                                ${progressMarkup}
                            </div>
                        `;
                    }).join("");
                };
                const renderUpgradeLines = () => {
                    if (!upgradeEntries.length) {
                        return `
                            <div class="routine-breakdown-line routine-breakdown-line-upgrade routine-breakdown-line-empty">
                                <span>${scope.Lang?.ui("No upgrade bonuses yet") || "No upgrade bonuses yet"}</span>
                                <strong>${formatMultiplier(1)}</strong>
                            </div>
                        `;
                    }
                    return upgradeEntries.map((entry: any) => {
                        const statName = scope.Lang?.stat(entry.statKey) || formatKeyLabel(entry.statKey);
                        const upgrade = scope.RoutineUpgradeSystem?.getSortedUpgrades?.().find((item: any) => item.stat === entry.statKey);
                        const level = upgrade?.level || 0;
                        return `
                            <div class="routine-breakdown-line routine-breakdown-line-upgrade">
                                <span>${statName} ${scope.Lang?.ui("Lv.") || "Lv."}${level}</span>
                                <strong>${formatMultiplier(entry.upgradeMultiplier)}</strong>
                            </div>
                        `;
                    }).join("");
                };

                container.innerHTML = `
                    <article class="info-card routine-breakdown-card routine-breakdown-card-total">
                        <div class="routine-breakdown-total-overlay">
                            <span class="routine-breakdown-total-fill routine-breakdown-total-fill-current" style="width:${(averageProgress * 100).toFixed(2)}%"></span>
                            <span class="routine-breakdown-total-fill routine-breakdown-total-fill-mastery" style="width:${(averageMasteryProgress * 100).toFixed(2)}%"></span>
                        </div>
                        <span class="metric-label">${scope.Lang?.ui("Routine Multiplier") || "Routine Multiplier"}</span>
                        <strong>${formatMultiplier(breakdown.totalMultiplier)}</strong>
                        <p class="info-note">${action.name} • ${scope.Lang?.ui("Applies to action speed only") || "Applies to action speed only"}</p>
                    </article>
                    <article class="info-card routine-breakdown-card">
                        <div class="routine-breakdown-panel-fill" style="width:${(averageProgress * 100).toFixed(2)}%"></div>
                        <span class="metric-label">${scope.Lang?.ui("Current Run Stats") || "Current Run Stats"}</span>
                        <strong>${formatMultiplier(breakdown.currentMultiplier)}</strong>
                        <p class="info-note">${scope.Lang?.ui("Current XP progress toward the next level across active routine stats") || "Current XP progress toward the next level across active routine stats"}</p>
                        <div class="routine-breakdown-lines">
                            ${renderLines("currentMultiplier", "currentLevel", "routine-breakdown-line-current")}
                        </div>
                    </article>
                    <article class="info-card routine-breakdown-card routine-breakdown-card-mastery">
                        <div class="routine-breakdown-panel-fill routine-breakdown-panel-fill-mastery" style="width:${(averageMasteryProgress * 100).toFixed(2)}%"></div>
                        <span class="metric-label">${scope.Lang?.ui("Mastery") || "Mastery"}</span>
                        <strong>${formatMultiplier(breakdown.masteryMultiplier)}</strong>
                        <p class="info-note">${scope.Lang?.ui("Carryover levels layer on top of the live run at a reduced pace") || "Carryover levels layer on top of the live run at a reduced pace"}</p>
                        <div class="routine-breakdown-lines">
                            ${renderLines("masteryMultiplier", "masteryLevel", "routine-breakdown-line-mastery")}
                        </div>
                    </article>
                    <article class="info-card routine-breakdown-card routine-breakdown-card-upgrades">
                        <span class="metric-label">${scope.Lang?.ui("Upgrades") || "Upgrades"}</span>
                        <strong>${formatMultiplier(breakdown.upgradesMultiplier || 1)}</strong>
                        <p class="info-note">${scope.Lang?.ui("Run upgrades add another multiplicative speed layer on top of stats and mastery") || "Run upgrades add another multiplicative speed layer on top of stats and mastery"}</p>
                        <div class="routine-breakdown-lines">
                            ${renderUpgradeLines()}
                        </div>
                    </article>
                    <article class="info-card routine-breakdown-card">
                        <span class="metric-label">${scope.Lang?.ui("Base XP Per Completion") || "Base XP Per Completion"}</span>
                        <strong>${Number(action.baseDuration || 0).toFixed(0)} XP</strong>
                        <p class="info-note">${scope.Lang?.ui("Rewards stay tied to the base cycle while multipliers shorten completion time") || "Rewards stay tied to the base cycle while multipliers shorten completion time"}</p>
                    </article>
                    <article class="info-card routine-breakdown-card routine-breakdown-card-preview">
                        <div class="routine-preview-media" style="${action.image ? `background-image:url(${action.image})` : ""}">
                            <span class="routine-preview-badge">${formatMultiplier(breakdown.totalMultiplier)}</span>
                            <span class="routine-preview-title">${action.name}</span>
                            <div class="routine-preview-progress">
                                <span class="routine-preview-progress-fill" style="width:${(slotProgress * 100).toFixed(2)}%"></span>
                            </div>
                            <div class="routine-preview-footer">
                                <span>${scope.Lang?.ui("Progress") || "Progress"} ${(slotProgress * 100).toFixed(0)}%</span>
                                <span>${scope.Lang?.ui("Time Left") || "Time Left"} ${formatRuntime(slotRemaining)}</span>
                            </div>
                        </div>
                    </article>
                `;
            },
            renderGrid(containerId: string, items: Array<{ label: string; value: string | number; note?: string }>) {
                const container = document.getElementById(containerId);
                if (!container) {
                    return;
                }
                container.innerHTML = "";
                items.forEach((item) => {
                    const card = document.createElement("article");
                    card.className = "info-card";
                    card.innerHTML = `<span class="metric-label">${item.label}</span><strong>${item.value}</strong>`;
                    if (item.note) {
                        const note = document.createElement("p");
                        note.className = "info-note";
                        note.textContent = item.note;
                        card.appendChild(note);
                    }
                    container.appendChild(card);
                });
            },
            renderOverviewStats(containerId: string) {
                const scope = getScope();
                const container = document.getElementById(containerId);
                if (!container) {
                    return;
                }
                container.innerHTML = "";
                (scope.StatsUI?.list || []).forEach((statKey: string) => {
                    const masteryKey = scope.PRESTIGE_MAP?.[statKey];
                    const masteryLevel = masteryKey ? (scope.getMasteryLevel?.(masteryKey) || 0) : 0;
                    const layerBreakdown = getStatLayerBreakdown(statKey);
                    const totalMultiplier = layerBreakdown.currentMultiplier * layerBreakdown.masteryMultiplier * layerBreakdown.upgradeMultiplier;
                    const upgradeLevel = scope.RoutineUpgradeSystem?.getSortedUpgrades?.()
                        ?.filter((item: any) => item.stat === statKey)
                        ?.reduce((sum: number, item: any) => sum + Number(item.level || 0), 0) || 0;
                    const card = document.createElement("article");
                    card.className = `stat-breakdown-card stat-breakdown-card-${statKey}`;
                    card.innerHTML = `
                        <div class="stat-breakdown-header">
                            <span class="stat-icon stat-icon-${statKey}">${getStatIcon(statKey)}</span>
                            <div>
                                <span class="metric-label">${scope.Lang?.stat(statKey) || formatKeyLabel(statKey)}</span>
                                <strong>${formatMultiplier(totalMultiplier)}</strong>
                            </div>
                        </div>
                        <div class="stat-breakdown-meta">
                            <span>${scope.Lang?.ui("Run") || "Run"} Lv.${scope.getStatLevel(statKey)}</span>
                            <span class="stat-breakdown-mastery">${scope.Lang?.ui("Mastery") || "Mastery"} Lv.${masteryLevel}</span>
                            <span class="stat-breakdown-upgrade">${scope.Lang?.ui("Upgrade") || "Upgrade"} Lv.${upgradeLevel}</span>
                        </div>
                        <div class="stat-breakdown-effects">
                            <span>${scope.Lang?.ui("Run") || "Run"} ${formatMultiplier(layerBreakdown.currentMultiplier)}</span>
                            <span class="stat-breakdown-mastery">${scope.Lang?.ui("Mastery") || "Mastery"} ${formatMultiplier(layerBreakdown.masteryMultiplier)}</span>
                            <span class="stat-breakdown-upgrade">${scope.Lang?.ui("Upgrade") || "Upgrade"} ${formatMultiplier(layerBreakdown.upgradeMultiplier)}</span>
                        </div>
                        <div class="routine-breakdown-progress">
                            <span class="routine-breakdown-progress-fill" style="width:${((scope.getStatExp(statKey) / Math.max(scope.getStatMax(statKey), 1)) * 100).toFixed(2)}%"></span>
                        </div>
                        <span class="routine-breakdown-progress-text">${formatXpProgress(scope.getStatExp(statKey), scope.getStatMax(statKey))}</span>
                    `;
                    container.appendChild(card);
                });
            },
            update() {
                const scope = getScope();
                const home = scope.HomeSystem?.homes?.find((item: any) => item.id === scope.State.homeId);
                this.renderRoutineInsights("routine-insights");
                this.renderRoutineInsights("overview-routine-insights");
                this.renderOverviewStats("overview-stat-breakdown");

                const activeDungeon = scope.State.currentDungeon || "frontier";
                const dungeonDefinition = getSelectedDungeonDefinition();
                const activeAdventureSlot = getActiveAdventureSlot();
                const activeEncounter = activeAdventureSlot?.encounter || null;
                const activeEncounterImage = activeEncounter?.image || "";
                const activeEncounterProgress = Math.max(0, Math.min(1, Number(activeAdventureSlot?.progress || 0)));
                const possibleDrops = dungeonDefinition ? (scope.EncounterUI?.getDungeonPossibleDrops?.(dungeonDefinition) || []) : [];
                const nextAdventureItems = [
                    {
                        label: scope.Lang?.ui("Route") || "Route",
                        value: scope.EncounterUI?.getDungeonStrongestStat?.(activeDungeon)
                            ? `${formatDungeonName(activeDungeon)}`
                            : formatDungeonName(activeDungeon),
                        note: dungeonDefinition?.description || (scope.Lang?.ui("Current expedition route") || "Current expedition route")
                    },
                    {
                        label: scope.Lang?.ui("Expedition Multiplier") || "Expedition Multiplier",
                        value: formatMultiplier(getDungeonAverageMultiplier(activeDungeon)),
                        note: dungeonDefinition?.recommendedStat
                            ? `${scope.Lang?.ui("Route Focus") || "Route Focus"}: ${scope.Lang?.stat(dungeonDefinition.recommendedStat) || formatKeyLabel(dungeonDefinition.recommendedStat)}`
                            : (scope.Lang?.ui("Balanced route profile") || "Balanced route profile")
                    },
                    {
                        label: scope.Lang?.ui("Active Encounter") || "Active Encounter",
                        value: activeEncounter?.name || (scope.Lang?.ui("Awaiting Deployment") || "Awaiting Deployment"),
                        note: activeEncounter
                            ? `${scope.Lang?.ui("Progress") || "Progress"} ${(activeEncounterProgress * 100).toFixed(0)}% • ${scope.Lang?.ui("Time Left") || "Time Left"} ${formatRuntime(Number(activeAdventureSlot?.duration || 0) * (1 - activeEncounterProgress))}`
                            : getNextDungeonUnlock()
                    },
                    {
                        label: scope.Lang?.ui("Possible Drops") || "Possible Drops",
                        value: possibleDrops.length ? `${possibleDrops.length} ${scope.Lang?.ui("Tracked") || "Tracked"}` : (scope.Lang?.ui("Unknown") || "Unknown"),
                        note: possibleDrops.length
                            ? possibleDrops.map((item: any) => `<span class="drop-chip">${item.image ? `<img src="${item.image}" alt="${item.name}" class="drop-chip-icon">` : ""}<span>${item.name}</span></span>`).join("")
                            : (scope.Lang?.ui("More route loot appears as new encounters are discovered") || "More route loot appears as new encounters are discovered")
                    }
                ];

                this.renderGrid("inventory-insights", [
                    {
                        label: scope.Lang?.ui("Current Home") || "Current Home",
                        value: home ? home.name : (scope.Lang?.ui("Default Hut") || "Default Hut"),
                        note: scope.Lang?.ui("Base of operations") || "Base of operations"
                    },
                    {
                        label: scope.Lang?.ui("Tracked Items") || "Tracked Items",
                        value: scope.Inventory?.getItems?.().length || 0,
                        note: scope.Lang?.ui("Visible inventory entries") || "Visible inventory entries"
                    },
                    {
                        label: scope.Lang?.ui("Equipped") || "Equipped",
                        value: scope.Equipment?.getEquippedCount?.() || 0,
                        note: formatEquipmentName(scope.State.equipment.rightHand, scope.Lang?.ui("Unarmed") || "Unarmed")
                    }
                ]);

                this.renderGrid("chip-insights", [
                    {
                        label: scope.Lang?.ui("Research Progress") || "Research Progress",
                        value: getResearchProgressLabel(),
                        note: scope.Lang?.ui("Milestones unlocked from gathered field data") || "Milestones unlocked from gathered field data"
                    },
                    {
                        label: scope.Lang?.ui("Action Data") || "Action Data",
                        value: getObjectTotal(scope.State.actionAssignments),
                        note: scope.Lang?.ui("Assignments recorded this run") || "Assignments recorded this run"
                    },
                    {
                        label: scope.Lang?.ui("Encounter Data") || "Encounter Data",
                        value: getObjectTotal(scope.State.encounterCompletions),
                        note: scope.Lang?.ui("Encounter clears stored for analysis") || "Encounter clears stored for analysis"
                    },
                    {
                        label: scope.Lang?.ui("Dungeon Data") || "Dungeon Data",
                        value: getObjectTotal(scope.State.adventureCompletions),
                        note: scope.Lang?.ui("Dungeon clears stored for milestones") || "Dungeon clears stored for milestones"
                    }
                ]);

                this.renderGrid("automation-insights", [
                    {
                        label: scope.Lang?.ui("Status") || "Status",
                        value: scope.Lang?.ui("Standby") || "Standby",
                        note: scope.Lang?.ui("Automation opens once research routes are defined") || "Automation opens once research routes are defined"
                    },
                    {
                        label: scope.Lang?.ui("Available Data") || "Available Data",
                        value: getObjectTotal(scope.State.actionAssignments) + getObjectTotal(scope.State.encounterCompletions),
                        note: scope.Lang?.ui("Telemetry ready for future command logic") || "Telemetry ready for future command logic"
                    }
                ]);

                this.renderGrid("overview-adventure-insights", nextAdventureItems.map((item) => ({
                    ...item,
                    note: item.note
                })));

                const adventureContainer = document.getElementById("overview-adventure-insights");
                if (adventureContainer) {
                    const cards = Array.from(adventureContainer.children) as HTMLElement[];
                    if (cards[2] && activeEncounterImage) {
                        cards[2].classList.add("info-card-encounter-preview");
                        cards[2].style.backgroundImage = `linear-gradient(180deg, rgba(8, 10, 18, 0.18), rgba(8, 10, 18, 0.72)), url(${activeEncounterImage})`;
                    }
                    if (cards[2]) {
                        const note = cards[2].querySelector(".info-note");
                        if (note && activeEncounter) {
                            note.innerHTML = `
                                <div class="overview-encounter-progress-meta">
                                    <span>${scope.Lang?.ui("Progress") || "Progress"} ${(activeEncounterProgress * 100).toFixed(0)}%</span>
                                    <span>${scope.Lang?.ui("Time Left") || "Time Left"} ${formatRuntime(Number(activeAdventureSlot?.duration || 0) * (1 - activeEncounterProgress))}</span>
                                </div>
                                <div class="overview-encounter-progress">
                                    <span class="overview-encounter-progress-fill" style="width:${(activeEncounterProgress * 100).toFixed(2)}%"></span>
                                </div>
                            `;
                        }
                    }
                    if (cards[3]) {
                        const note = cards[3].querySelector(".info-note");
                        if (note && nextAdventureItems[3].note) {
                            note.innerHTML = nextAdventureItems[3].note;
                        }
                    }
                }

                const adventureButton = document.getElementById("overview-open-adventure") as HTMLButtonElement | null;
                if (adventureButton) {
                    adventureButton.disabled = !scope.TabManager.isTabVisible("adventure");
                }
            }
        }
    };
}
