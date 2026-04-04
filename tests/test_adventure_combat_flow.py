import json
import subprocess


def test_adventure_engine_combat_starts_combat_engine_without_resource_spend():
    script = r"""
const { AdventureEngine } = require('./js/adventure_engine.js');

global.State = {
  adventureSlots: [{ encounter:null, duration:1, progress:0, active:false }],
  queuedEncounterId: null,
  encounterCompletions: {},
  adventureCompletions: {},
  combat: { active:false },
  encounterStreak: 0,
  healerGoneSeen: true
};
global.EncounterGenerator = {
  randomEncounter(){
    return {
      id:'wolfAmbush',
      combat:true,
      name:'Wolf Ambush',
      dungeon:'deep_woods',
      getDuration(){ return 1; }
    };
  },
  decrementLevel(){},
  resetProgress(){},
  updateProgressBar(){},
  incrementLevel(){},
  encounters:[]
};
global.CombatEngine = {
  started:false,
  start(enc){ this.started = enc.id; },
  isActive(){ return false; },
  clear(){},
  tick(){}
};
global.updateAdventureSlotUI = function(){};
global.setState = function(path, value){ State[path] = value; };
global.updateState = function(path, fn){
  if (Array.isArray(path)) {
    let obj = State;
    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]]) obj[path[i]] = {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = fn(obj[path[path.length - 1]]);
    return;
  }
  State[path] = fn(State[path]);
};
global.PubSub = { publish(){} };
global.Lang = { resource(key){ return key; }, log(){ return ''; }, ui(key){ return key; } };
global.Log = { add() {} };

AdventureEngine.startSlot(0);
console.log(JSON.stringify({
  started: CombatEngine.started,
  active: State.adventureSlots[0].active,
  encounter: State.adventureSlots[0].encounter.id
}));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['started'] == 'wolfAmbush'
    assert data['active'] is True
    assert data['encounter'] == 'wolfAmbush'
