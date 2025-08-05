import json
import subprocess


def test_prestige_resets_equipment():
    script = r"""
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('./js/save_system.js', 'utf8');

const context = {
  State: {
    stats:{}, resources:{}, prestige:{}, prestiging:false,
    slots:[], adventureSlots:[{}], inventory:{}, homeId:null, homesOwned:[],
    furniture:[], researchCompleted:[], adventureLevels:{forest:1},
    currentAdventure:'forest', adventureActive:false, encounterLevel:1, encounterStreak:0,
    equipment:{ head:'leather_armor', armor:null, leftHand:null, rightHand:'stone_spear', pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null }
  },
  actions: {},
  loadBaseData: async()=>{},
  applyPrestigeBonuses: ()=>{},
  FurnitureSystem: { furniture: [] },
  PubSub: { publish: ()=>{} },
  HomeSystem: { assignDefault: ()=>{} },
  Logger: { info: ()=>{}, error: ()=>{} },
  VERSION:2,
  STAT_KEYS:[],
  RESOURCE_KEYS:[],
  PRESTIGE_MAP:{},
  PRESTIGE_KEYS:[],
  localStorage: { setItem: ()=>{} },
  window: { location: { reload: ()=>{} } }
};
context.setState = function(path, value){
  if (Array.isArray(path)) {
    let o = context.State;
    for (let i = 0; i < path.length - 1; i++) {
      if (!o[path[i]]) {
        o[path[i]] = {};
      }
      o = o[path[i]];
    }
    o[path[path.length - 1]] = value;
  } else {
    context.State[path] = value;
  }
};

vm.createContext(context);
vm.runInContext(code + '\n;globalThis.SaveSystem = SaveSystem;', context);
context.SaveSystem.save = ()=>{};
context.SaveSystem.prestige().then(() => {
  console.log(JSON.stringify(context.State.equipment));
});
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert all(v is None for v in data.values())
