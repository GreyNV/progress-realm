// CombatEngine resolves structured auto-battles for combat encounters.
// It derives player stats from core stats plus equipped gear and runs a
// deterministic turn loop that publishes UI updates through PubSub.
function getCombatStatLevel(name) {
    if (typeof getStatLevel === 'function') {
        return getStatLevel(name);
    }
    if (typeof getStatValue === 'function') {
        return getStatValue(name);
    }
    if (State.stats && State.stats[name]) {
        return State.stats[name].level || State.stats[name].value || 0;
    }
    return 0;
}

function getCombatPrestigeValue(key) {
    return State.prestige && State.prestige[key] ? State.prestige[key] : 0;
}

const CombatEngine = {
    basePlayerSprite: 'assets/char/new_char.png',

    isActive() {
        return !!State.combat.active;
    },

    getEquipmentItem(slot) {
        const itemId = State.equipment[slot];
        if (!itemId) return null;
        return ItemGenerator.itemList.find(item => item.id === itemId) || null;
    },

    getPlayerSprite() {
        if (typeof CharacterBackground !== 'undefined' && CharacterBackground.getImage) {
            return CharacterBackground.getImage();
        }
        return this.basePlayerSprite;
    },

    derivePlayerStats(encounter) {
        const weapon = this.getEquipmentItem('rightHand');
        const shield = this.getEquipmentItem('leftHand');
        const equippedItems = Object.values(State.equipment)
            .filter(Boolean)
            .map(id => ItemGenerator.itemList.find(item => item.id === id))
            .filter(Boolean);

        const stats = {
            maxHp: 18 + getCombatStatLevel('strength') * 1.5 + getCombatStatLevel('constitution') * 1.5,
            hp: 18 + getCombatStatLevel('strength') * 1.5 + getCombatStatLevel('constitution') * 1.5,
            attack: 2 + getCombatStatLevel('strength') * 0.7 + getCombatStatLevel('agility') * 0.3 + getCombatPrestigeValue('constitution') * 0.18,
            defense: 1 + getCombatStatLevel('constitution') * 0.18 + getCombatPrestigeValue('vigor') * 0.08,
            speed: 0.8 + getCombatStatLevel('agility') * 0.04 + getCombatStatLevel('intelligence') * 0.01 + getCombatPrestigeValue('reflexes') * 0.012,
            critChance: 0.05 + getCombatStatLevel('agility') * 0.004 + getCombatPrestigeValue('reflexes') * 0.001,
            critDamage: 1.5,
            blockChance: 0,
            blockValue: 0,
            sprite: this.getPlayerSprite(),
            name: Lang.ui('Traveler') || 'Traveler',
            weaponName: weapon ? weapon.name : (Lang.ui('Unarmed') || 'Unarmed'),
            shieldName: shield ? shield.name : (Lang.ui('No Shield') || 'No Shield')
        };

        equippedItems.forEach(item => {
            const bonuses = item.combatBonuses || {};
            Object.entries(bonuses).forEach(([key, value]) => {
                if (stats[key] === undefined) stats[key] = 0;
                stats[key] += value;
            });
        });

        if (weapon && weapon.weaponProfile) {
            stats.attack += weapon.weaponProfile.baseAttack || 0;
            stats.speed *= weapon.weaponProfile.speed || 1;
            stats.critChance += weapon.weaponProfile.critChance || 0;
            if (weapon.weaponProfile.critDamage) {
                stats.critDamage = Math.max(stats.critDamage, weapon.weaponProfile.critDamage);
            }
        }

        if (shield && shield.shieldProfile) {
            stats.blockChance += shield.shieldProfile.blockChance || 0;
            stats.blockValue += shield.shieldProfile.blockValue || 0;
        }

        if (encounter && encounter.category === 'intelligence') {
            stats.speed += getCombatStatLevel('intelligence') * 0.02 + getCombatPrestigeValue('wisdom') * 0.01;
        }

        stats.maxHp = Math.round(stats.maxHp);
        stats.hp = stats.maxHp;
        stats.attack = Number(stats.attack.toFixed(2));
        stats.defense = Number(stats.defense.toFixed(2));
        stats.speed = Number(stats.speed.toFixed(2));
        stats.critChance = Number(stats.critChance.toFixed(3));
        return stats;
    },

    deriveEnemyStats(encounter) {
        const enemy = encounter.enemy || {};
        return {
            name: enemy.name || encounter.name,
            type: enemy.type || 'hostile',
            sprite: enemy.sprite || encounter.image || '',
            maxHp: enemy.maxHp || 12,
            hp: enemy.maxHp || 12,
            attack: enemy.attack || 3,
            defense: enemy.defense || 1,
            speed: enemy.speed || 1,
            critChance: enemy.critChance || 0.04,
            critDamage: enemy.critDamage || 1.5
        };
    },

    start(encounter) {
        const player = this.derivePlayerStats(encounter);
        const enemy = this.deriveEnemyStats(encounter);
        setState('combat', {
            active: true,
            phase: 'battle',
            encounterId: encounter.id,
            round: 1,
            player,
            enemy,
            log: [
                `${player.name} enters combat with ${enemy.name}.`,
                `${player.weaponName} ready${player.shieldName !== (Lang.ui('No Shield') || 'No Shield') ? `, ${player.shieldName} raised.` : '.'}`
            ],
            outcome: null,
            timeToNextTurn: 0.8
        });
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('combat:update', State.combat);
        }
    },

    appendLog(message) {
        State.combat.log.push(message);
        if (State.combat.log.length > 8) {
            State.combat.log.shift();
        }
    },

    rollAttack(attacker, defender, isPlayer) {
        let damage = Math.max(1, attacker.attack - defender.defense * 0.5);
        let blocked = false;
        if (!isPlayer && Math.random() < (State.combat.player.blockChance || 0)) {
            damage = Math.max(0, damage - (State.combat.player.blockValue || 0));
            blocked = true;
        }
        const crit = Math.random() < (attacker.critChance || 0);
        if (crit) {
            damage *= attacker.critDamage || 1.5;
        }
        damage = Math.max(0, Math.round(damage));
        defender.hp = Math.max(0, defender.hp - damage);
        return { damage, crit, blocked };
    },

    stepRound() {
        const combat = State.combat;
        if (!combat.active || combat.phase !== 'battle') return;

        const actors = [
            { key: 'player', speed: combat.player.speed, isPlayer: true },
            { key: 'enemy', speed: combat.enemy.speed, isPlayer: false }
        ].sort((a, b) => b.speed - a.speed);

        actors.forEach(actor => {
            if (combat.player.hp <= 0 || combat.enemy.hp <= 0) return;
            const attacker = actor.isPlayer ? combat.player : combat.enemy;
            const defender = actor.isPlayer ? combat.enemy : combat.player;
            const result = this.rollAttack(attacker, defender, actor.isPlayer);
            const attackerName = attacker.name;
            const defenderName = defender.name;
            let line = `${attackerName} hits ${defenderName} for ${result.damage}.`;
            if (result.crit) line += ' Critical strike.';
            if (result.blocked) line += ' The blow is partially blocked.';
            this.appendLog(line);
        });

        if (combat.enemy.hp <= 0) {
            combat.phase = 'victory';
            combat.outcome = 'victory';
            this.appendLog(`${combat.enemy.name} falls. Victory is yours.`);
        } else if (combat.player.hp <= 0) {
            combat.phase = 'defeat';
            combat.outcome = 'defeat';
            this.appendLog(`${combat.player.name} is overwhelmed and forced back.`);
        } else {
            combat.round += 1;
        }
    },

    tick(delta) {
        if (!this.isActive()) return;
        State.combat.timeToNextTurn -= delta * State.time;
        if (State.combat.timeToNextTurn > 0) return;
        State.combat.timeToNextTurn = 0.8;
        this.stepRound();
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('combat:update', State.combat);
        }
    },

    finishVictory() {
        const encounterId = State.combat.encounterId;
        this.clear();
        return encounterId;
    },

    clear() {
        setState('combat', createDefaultCombatState());
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('combat:update', State.combat);
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { CombatEngine };
}
