import os
import json
import subprocess


def test_resources_tab_in_ui_json():
    path = os.path.join('data', 'ui.json')
    with open(path) as f:
        data = json.load(f)
    tab = next((t for t in data['tabs'] if t['id'] == 'resources'), None)
    assert tab is not None
    assert tab['sections'][0]['type'] == 'buttons'


def test_resources_tab_markup_and_script():
    with open('index.html') as f:
        html = f.read()
    assert 'data-tab="resources"' in html
    assert 'id="resource-list"' in html
    assert 'js/ui/resources_tab.js' in html


def test_resources_tab_entries_and_descriptions():
    script = r"""
class Elem {
  constructor(tag){
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.dataset = {};
    this.textContent = '';
    this.eventListeners = {};
    this.classList = {
      add: c => { if (!this.className.split(' ').includes(c)) this.className += (this.className ? ' ' : '') + c; },
      remove: c => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); },
      toggle: c => { if (this.className.split(' ').includes(c)) { this.classList.remove(c); return false; } else { this.classList.add(c); return true; } },
      contains: c => this.className.split(' ').includes(c)
    };
  }
  appendChild(ch){ this.children.push(ch); }
  addEventListener(ev, fn){ this.eventListeners[ev] = fn; }
  click(){ if (this.eventListeners['click']) this.eventListeners['click'](); }
}
const elements = { 'resource-list': new Elem('ul') };
global.document = { getElementById: id => elements[id], createElement: tag => new Elem(tag) };
global.State = {
  stats: { strength: { value:1, baseMax:10, maxAdditions:[], maxMultipliers:[] } },
  resources: { energy: { value:5, baseMax:10, maxAdditions:[], maxMultipliers:[] } },
  prestige: { wisdom: { value:2, baseMax:Infinity, maxAdditions:[], maxMultipliers:[] } },
  mastery: { value:3, baseMax:Infinity, maxAdditions:[], maxMultipliers:[] },
  statDescriptions: { strength: 'Power' },
  resourceDescriptions: { energy: 'Use', mastery: 'Mastered' },
  prestigeDescriptions: { wisdom: 'Bonus' },
  masteryDescription: 'Mastered'
};
global.StatSystem = { max: r => r.baseMax };
global.ResourceSystem = { max: r => r.baseMax };
global.Lang = {
  stat: k => k,
  resource: k => k,
  ui: k => k,
  statDesc: k => null,
  resourceDesc: k => null,
  prestigeDesc: k => null
};
global.capitalize = s => s;
global.PubSub = { subscribe: () => {} };
const { ResourcesTab } = require('./js/ui/resources_tab.js');
ResourcesTab.init();
const list = elements['resource-list'].children;
const out = {};
for (const li of list) {
  const name = li.children[0].children[0].textContent;
  const amt = li.children[0].children[1].textContent;
  const desc = li.children[1].children[0].textContent;
  out[name] = { amount: amt, desc: desc };
}
console.log(JSON.stringify(out));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    out = json.loads(result.stdout.strip())
    assert out['strength']['amount'] == '1/10'
    assert out['energy']['amount'] == '5/10'
    assert out['wisdom']['amount'] == '2'
    assert out['mastery']['amount'] == '3'
    assert out['strength']['desc'] == 'Power'
    assert out['energy']['desc'] == 'Use'
    assert out['wisdom']['desc'] == 'Bonus'
    assert out['mastery']['desc'] == 'Mastered'


def test_uk_translation_resources_tab():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Resources' in ui
    assert 'Resource Modifiers' in ui
