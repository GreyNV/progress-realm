import json
import subprocess


def test_encounter_ui_uses_softcap_label():
    script = r"""
class Elem {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.textContent = '';
    }
    appendChild(ch) { this.children.push(ch); }
}

const locationEl = new Elem('div');
const progressEl = new Elem('progress');

global.document = {
    getElementById: id => {
        if (id === 'encounter-location') return locationEl;
        if (id === 'encounter-level-progress') return progressEl;
        return null;
    }
};

global.EncounterGenerator = {
    level: 3,
    milestones: [
        { level: 1, name: 'Forest' },
        { level: 5, name: 'Ruins' }
    ]
};

global.State = { maxEncounterLevel: 5, encounterStreak: 0 };
global.PubSub = { subscribe: () => {} };

const { EncounterUI } = require('./js/ui/encounter.js');

EncounterUI.updateName();
console.log(JSON.stringify(locationEl.textContent));

State.maxEncounterLevel = Infinity;
EncounterUI.updateName();
console.log(JSON.stringify(locationEl.textContent));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    lines = [json.loads(line) for line in result.stdout.strip().splitlines()]
    assert lines[0] == 'Forest (Level 3.000, Softcap 5.000)'
    assert 'Max' not in lines[0]
    assert lines[1] == 'Forest (Level 3.000)'
