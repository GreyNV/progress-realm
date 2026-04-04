import json
import subprocess


def test_player_combat_stats_include_weapon_and_shield():
    script = r"""
const { CombatEngine } = require('./js/combat_engine.js');

global.State = {
  equipment: {
    head:null, armor:'leather_armor', leftHand:'wooden_shield', rightHand:'iron_sword',
    pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:'gem'
  },
  stats: {
    strength: { value: 10 },
    agility: { value: 8 },
    constitution: { value: 6 },
    intelligence: { value: 6 }
  }
};
global.ItemGenerator = {
  itemList: [
    { id:'iron_sword', name:'Iron Sword', weaponProfile:{ baseAttack: 6, speed: 1, critChance: 0.12, critDamage: 1.75 } },
    { id:'wooden_shield', name:'Wooden Shield', shieldProfile:{ blockChance: 0.35, blockValue: 2 }, combatBonuses:{ defense: 1, maxHp: 3 } },
    { id:'leather_armor', name:'Leather Armor', combatBonuses:{ maxHp: 8, defense: 2 } },
    { id:'gem', name:'Gem', combatBonuses:{ critChance: 0.05, speed: 0.15 } }
  ]
};
global.CharacterBackground = { getImage(){ return 'hero.png'; } };
global.Lang = { ui(key){ return key; } };
global.getStatValue = function(name){ return State.stats[name].value; };
const stats = CombatEngine.derivePlayerStats({ category: 'strength' });
console.log(JSON.stringify(stats));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['attack'] >= 15
    assert data['defense'] >= 4
    assert data['blockChance'] == 0.35
    assert data['blockValue'] == 2
    assert data['weaponName'] == 'Iron Sword'


def test_combat_tick_reaches_victory():
    script = r"""
const { CombatEngine } = require('./js/combat_engine.js');
global.Math.random = () => 0.99;
global.State = {
  equipment: { head:null, armor:null, leftHand:null, rightHand:null, pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null },
  stats: {
    strength: { value: 8 },
    agility: { value: 5 },
    constitution: { value: 4 },
    intelligence: { value: 2 }
  },
  combat: { active:false }
};
global.ItemGenerator = { itemList: [] };
global.CharacterBackground = { getImage(){ return 'hero.png'; } };
global.Lang = { ui(key){ return key; } };
global.PubSub = { publish(){} };
global.createDefaultCombatState = function(){ return { active:false, phase:'idle', encounterId:null, round:0, player:null, enemy:null, log:[], outcome:null, timeToNextTurn:0 }; };
global.setState = function(path, value){ State[path] = value; };
global.getStatValue = function(name){ return State.stats[name].value; };
CombatEngine.start({
  id:'wolfAmbush',
  category:'strength',
  enemy:{ name:'Wolf', sprite:'wolf.png', maxHp:1, attack:1, defense:0, speed:0.5 }
});
CombatEngine.tick(1);
console.log(JSON.stringify(State.combat));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['phase'] == 'victory'
    assert data['enemy']['hp'] == 0
