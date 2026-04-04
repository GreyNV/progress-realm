import json
import subprocess


def test_action_engine_tracks_assignments_and_runtime():
    script = r"""
const { ActionEngine } = require('./js/action_engine.js');

global.State = {
  defaultActionId: 'idle',
  time: 1,
  actionAssignments: {},
  actionRuntime: {},
  slots: [{ actionId: 'idle', progress: 0, blocked: false, text: '', queuedActionId: null, queue: null }]
};
global.actions = {
  idle: { id: 'idle', name: 'Idle', exp: 0, expToNext: 10, level: 1 },
  training: { id: 'training', name: 'Training', exp: 2, expToNext: 8, level: 3 }
};
global.DeltaEngine = { calculate() {}, apply() {} };
global.updateSlotUI = () => {};
global.FurnitureSystem = {};
global.SoftCapSystem = { apply() {} };
global.SaveSystem = { save() {} };
global.updateState = (path, fn) => {
  let obj = State;
  for (let i = 0; i < path.length - 1; i++) {
    if (!obj[path[i]]) obj[path[i]] = {};
    obj = obj[path[i]];
  }
  obj[path[path.length - 1]] = fn(obj[path[path.length - 1]]);
};

ActionEngine.start(0, 'training');
ActionEngine.tick(2);

console.log(JSON.stringify({
  actionId: State.slots[0].actionId,
  progress: State.slots[0].progress,
  assignments: State.actionAssignments.training,
  runtime: State.actionRuntime.training
}));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())

    assert data['actionId'] == 'training'
    assert data['assignments'] == 1
    assert data['runtime'] == 2
    assert data['progress'] == 0.25


def test_stat_system_levels_and_carries_exp():
    script = r"""
const { StatSystem } = require('./js/state.js');
const stat = StatSystem.create(0, 9999, 'strength');
StatSystem.add(stat, 12);
console.log(JSON.stringify(stat));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())

    assert data['level'] == 1
    assert data['value'] == 1
    assert data['exp'] == 2
    assert data['expToNext'] > 10


def test_stat_xp_gain_multiplier_is_increased():
    with open('js/engine.js', encoding='utf-8') as f:
        text = f.read()
    assert 'STAT_XP_GAIN_MULTIPLIER = 1.2' in text


def test_adventure_engine_records_encounter_and_dungeon_completions():
    script = r"""
const { AdventureEngine } = require('./js/adventure_engine.js');

global.State = {
  healerGoneSeen: true,
  queuedEncounterId: null,
  encounterStreak: 0,
  autoProgress: false,
  combat: { active: false },
  encounterCompletions: {},
  adventureCompletions: {},
  adventureSlots: [{ encounter: null, duration: 1, progress: 0, active: false, queue: null }]
};
const encounter = {
  id: 'forest-scout',
  name: 'Forest Scout',
  dungeon: 'deep_woods',
  combat: false,
  getDuration() { return 4; }
};
global.EncounterGenerator = {
  encounters: [encounter],
  level: 1,
  randomEncounter() { return encounter; },
  decrementLevel() {},
  resetProgress() {},
  updateProgressBar() {},
  incrementLevel() {},
  resolve() {}
};
global.CombatEngine = { isActive() { return false; }, clear() {}, start() {}, tick() {} };
global.updateAdventureSlotUI = () => {};
global.setState = (path, value) => { State[path] = value; };
global.updateState = (path, fn) => {
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
global.Lang = { resource(key) { return key; }, log() { return ''; }, ui(key) { return key; } };
global.Log = { add() {} };
global.PubSub = { publish() {} };

AdventureEngine.startSlot(0);
State.adventureSlots[0].progress = 1;
AdventureEngine.tick(0);

console.log(JSON.stringify({
  encounterCompletions: State.encounterCompletions,
  adventureCompletions: State.adventureCompletions,
  encounterStreak: State.encounterStreak
}));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())

    assert data['encounterCompletions']['forest-scout'] == 1
    assert data['adventureCompletions']['deep_woods'] == 1
    assert data['encounterStreak'] == 1
