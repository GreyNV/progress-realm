import json
import subprocess


def test_prestige_resets_equipment():
    script = r"""
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('./js/save_system.js', 'utf8');

const context = {
  State: {
    age: { years: 16, days: 0, max: 75 },
    stats:{}, resources:{}, prestige:{}, prestiging:false,
    slots:[{ queuedActionId: null }], adventureSlots:[{}], inventory:{},
    equipment:{
      head:null, armor:'leather_armor', leftHand:'wooden_shield', rightHand:'stone_spear',
      pants:null, boots:null, gloves:null, ring1:null, ring2:null, necklace:null
    },
    homeId:null, homesOwned:[], furniture:[], researchCompleted:[],
    encounterLevel:1, encounterStreak:0, queuedEncounterId:null
  },
  actions: {},
  VERSION: 2,
  STAT_KEYS: [],
  RESOURCE_KEYS: [],
  PRESTIGE_MAP: {},
  PRESTIGE_KEYS: [],
  createDefaultEquipment: () => ({
    head:null, armor:null, leftHand:null, rightHand:null, pants:null,
    boots:null, gloves:null, ring1:null, ring2:null, necklace:null
  }),
  createDefaultCombatState: () => ({
    active:false, phase:'idle', encounterId:null, round:0,
    player:null, enemy:null, log:[], outcome:null, timeToNextTurn:0
  }),
  loadBaseData: async()=>{},
  applyPrestigeBonuses: ()=>{},
  localStorage: { setItem(){}, removeItem(){} },
  window: { location: { reload(){} } }
};
context.setState = function(path, value){
  if (Array.isArray(path)) {
    let obj = context.State;
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
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
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data == {
        'head': None,
        'armor': None,
        'leftHand': None,
        'rightHand': None,
        'pants': None,
        'boots': None,
        'gloves': None,
        'ring1': None,
        'ring2': None,
        'necklace': None,
    }
