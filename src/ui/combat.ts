export function createCombatUi() {
    return {
        initState() {
            return {
                console: document.getElementById("combat-console"),
                playerSprite: document.getElementById("combat-player-sprite"),
                enemySprite: document.getElementById("combat-enemy-sprite"),
                playerName: document.getElementById("combat-player-name"),
                enemyName: document.getElementById("combat-enemy-name"),
                playerHp: document.getElementById("combat-player-hp"),
                enemyHp: document.getElementById("combat-enemy-hp"),
                playerHpFill: document.getElementById("combat-player-hp-fill"),
                enemyHpFill: document.getElementById("combat-enemy-hp-fill"),
                playerStats: document.getElementById("combat-player-stats"),
                enemyStats: document.getElementById("combat-enemy-stats"),
                playerWeapon: document.getElementById("combat-player-weapon"),
                playerShield: document.getElementById("combat-player-shield"),
                enemyIntent: document.getElementById("combat-enemy-intent"),
                log: document.getElementById("combat-log"),
                outcome: document.getElementById("combat-outcome-banner")
            };
        },
        renderStatList(target: HTMLElement | null, stats: any, isPlayer: boolean) {
            const scope = globalThis as any;
            if (!target || !stats) return;
            const entries = isPlayer
                ? [
                    `${scope.Lang?.ui("Attack") || "Attack"}: ${stats.attack}`,
                    `${scope.Lang?.ui("Defense") || "Defense"}: ${stats.defense}`,
                    `${scope.Lang?.ui("Speed") || "Speed"}: ${stats.speed}`,
                    `${scope.Lang?.ui("Block") || "Block"}: ${(stats.blockChance * 100).toFixed(0)}% / ${stats.blockValue}`,
                    `${scope.Lang?.ui("Crit") || "Crit"}: ${(stats.critChance * 100).toFixed(0)}%`
                ]
                : [
                    `${scope.Lang?.ui("Attack") || "Attack"}: ${stats.attack}`,
                    `${scope.Lang?.ui("Defense") || "Defense"}: ${stats.defense}`,
                    `${scope.Lang?.ui("Speed") || "Speed"}: ${stats.speed}`,
                    `${scope.Lang?.ui("Type") || "Type"}: ${stats.type || "hostile"}`
                ];
            target.innerHTML = "";
            entries.forEach((entry) => {
                const li = document.createElement("li");
                li.textContent = entry;
                target.appendChild(li);
            });
        },
        updateBar(fill: HTMLElement | null, current: number, max: number) {
            if (!fill) return;
            const width = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
            fill.style.width = `${width}%`;
        },
        render(state: any) {
            const scope = globalThis as any;
            if (!state.console) return;
            const combat = scope.State.combat;
            const active = combat && combat.active;
            state.console.classList.toggle("hidden", !active);
            if (!active) {
                if (state.outcome) state.outcome.textContent = "";
                return;
            }
            const player = combat.player;
            const enemy = combat.enemy;
            if (state.playerName) state.playerName.textContent = player.name;
            if (state.enemyName) state.enemyName.textContent = enemy.name;
            if (state.playerHp) state.playerHp.textContent = `${player.hp} / ${player.maxHp}`;
            if (state.enemyHp) state.enemyHp.textContent = `${enemy.hp} / ${enemy.maxHp}`;
            this.updateBar(state.playerHpFill as HTMLElement | null, player.hp, player.maxHp);
            this.updateBar(state.enemyHpFill as HTMLElement | null, enemy.hp, enemy.maxHp);
            if (state.playerWeapon) state.playerWeapon.textContent = `${scope.Lang?.ui("Weapon") || "Weapon"}: ${player.weaponName}`;
            if (state.playerShield) state.playerShield.textContent = `${scope.Lang?.ui("Shield") || "Shield"}: ${player.shieldName}`;
            if (state.enemyIntent) state.enemyIntent.textContent = `${scope.Lang?.ui("Round") || "Round"} ${combat.round}`;
            this.renderStatList(state.playerStats as HTMLElement | null, player, true);
            this.renderStatList(state.enemyStats as HTMLElement | null, enemy, false);
            if (state.playerSprite) (state.playerSprite as HTMLElement).style.backgroundImage = player.sprite ? `url(${player.sprite})` : "none";
            if (state.enemySprite) (state.enemySprite as HTMLElement).style.backgroundImage = enemy.sprite ? `url(${enemy.sprite})` : "none";
            if (state.log) {
                state.log.innerHTML = "";
                combat.log.forEach((line: string) => {
                    const div = document.createElement("div");
                    div.className = "combat-log-entry";
                    div.textContent = line;
                    state.log.appendChild(div);
                });
            }
            if (state.outcome) {
                state.outcome.textContent = combat.phase === "victory"
                    ? (scope.Lang?.ui("Victory") || "Victory")
                    : combat.phase === "defeat"
                        ? (scope.Lang?.ui("Forced Retreat") || "Forced Retreat")
                        : "";
                state.outcome.classList.toggle("is-victory", combat.phase === "victory");
                state.outcome.classList.toggle("is-defeat", combat.phase === "defeat");
            }
        }
    };
}
