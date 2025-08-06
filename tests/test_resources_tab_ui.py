import json
import os
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


def test_resources_tab_toggle_behavior():
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
global.State = { resources: { energy: { value: 5, baseMax: 10, maxAdditions: [2], maxMultipliers: [2] } } };
global.ResourceSystem = { max: r => r.baseMax };
global.Lang = { resource: k => k };
global.capitalize = s => s;
global.PubSub = { subscribe: (ev, fn) => { global.eventName = ev; } };
const { ResourcesTab } = require('./js/ui/resources_tab.js');
ResourcesTab.init();
const li = elements['resource-list'].children[0];
const btn = li.children[0];
btn.click();
console.log(JSON.stringify({
  detail: li.children[1].className,
  event: global.eventName,
  first: btn.children[0].className,
  second: btn.children[1].className,
  text: btn.children[1].textContent
}));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    out = json.loads(result.stdout.strip())
    assert out['event'] == 'resource:changed'
    assert out['detail'] == 'resource-detail'
    assert out['first'] == 'resource-label'
    assert out['second'] == 'resource-amount'
    assert out['text'] == '10/5'


def test_uk_translation_resources_tab():
    path = os.path.join('data', 'lang', 'uk.json')
    with open(path) as f:
        data = json.load(f)
    ui = data.get('ui', {})
    assert 'Resources' in ui
    assert 'Resource Modifiers' in ui
