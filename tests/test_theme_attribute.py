import json
import subprocess


def test_index_has_data_theme():
    with open('index.html') as f:
        text = f.read()
    assert 'data-theme' in text


def test_apply_dark_mode_sets_dataset():
    script = r"""
class Body { constructor() { this.dataset = {}; } }
const toggle = { checked: false };
global.document = { body: new Body(), getElementById: id => toggle };
global.State = { darkMode: true };
const { applyDarkMode } = require('./js/story_core.js');
applyDarkMode();
const first = { theme: document.body.dataset.theme, checked: toggle.checked };
State.darkMode = false;
applyDarkMode();
const second = { theme: document.body.dataset.theme, checked: toggle.checked };
console.log(JSON.stringify({ first, second }));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    data = json.loads(result.stdout.strip())
    assert data['first']['theme'] == 'dark'
    assert data['first']['checked'] is True
    assert data['second']['theme'] == 'light'
    assert data['second']['checked'] is False

