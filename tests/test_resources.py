import json
import os
import subprocess


def test_resources_structure():
    path = os.path.join('data', 'resources.json')
    with open(path) as f:
        data = json.load(f)
    assert 'stats' in data
    assert 'resources' in data
    assert 'prestige' in data

    for section in ['stats', 'resources']:
        assert isinstance(data[section], dict)
        for entry in data[section].values():
            assert entry['value'] == 0
            assert entry['baseMax'] == 10
            assert 'description' in entry
            assert isinstance(entry['description'], str)

    assert isinstance(data['prestige'], dict)
    for entry in data['prestige'].values():
        assert 'value' in entry and entry['value'] == 0
        assert 'description' in entry and isinstance(entry['description'], str)
        assert 'baseMax' not in entry


def test_prestige_resources_are_infinite():
    script = r"""
const fs = require('fs');
global.Logger = { info: () => {}, error: () => {} };
global.fetch = path => Promise.resolve({ ok: true, json: () => JSON.parse(fs.readFileSync(path, 'utf8')) });
const { loadBaseData, State, StatSystem } = require('./js/state.js');
loadBaseData().then(() => {
  const out = {};
  for (const [k, v] of Object.entries(State.prestige)) {
    out[k] = { baseMax: String(v.baseMax), max: String(StatSystem.max(v)) };
  }
  console.log(JSON.stringify(out));
});
"""
    result = subprocess.run(
        ['node', '-e', script], capture_output=True, text=True, check=True
    )
    data = json.loads(result.stdout.strip())
    for info in data.values():
        assert info['baseMax'] == 'Infinity'
        assert info['max'] == 'Infinity'


def test_uk_translations_exist():
    with open(os.path.join('data', 'resources.json')) as f:
        data = json.load(f)
    with open(os.path.join('data', 'lang', 'uk.json')) as f:
        lang = json.load(f)
    for name in data['stats']:
        assert name in lang.get('statDescriptions', {})
    for name in data['resources']:
        assert name in lang.get('resourceDescriptions', {})
    for name in data['prestige']:
        assert name in lang.get('prestigeDescriptions', {})
