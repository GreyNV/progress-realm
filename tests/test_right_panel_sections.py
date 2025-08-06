import json
import subprocess


def test_right_panel_sections_render():
    with open('index.html') as f:
        html = f.read()
    assert 'right-tabs' not in html
    assert '<div id="slots"' in html
    assert '<div id="log"' in html
    assert html.count('collapsible-section') == 2


def test_right_panel_collapsible_behavior():
    script = r"""
class Elem {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.className = '';
        this.dataset = {};
        this.eventListeners = {};
        this.classList = {
            add: c => { if (!this.className.split(' ').includes(c)) this.className += (this.className ? ' ' : '') + c; },
            remove: c => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); },
            toggle: c => { if (this.className.split(' ').includes(c)) { this.classList.remove(c); return false; } else { this.classList.add(c); return true; } },
            contains: c => this.className.split(' ').includes(c)
        };
    }
    appendChild(ch) { this.children.push(ch); ch.parent = this; }
    addEventListener(ev, fn) { this.eventListeners[ev] = fn; }
    click() { if (this.eventListeners['click']) this.eventListeners['click'](); }
    querySelector(sel) {
        const cls = sel.slice(1);
        return this.children.find(ch => ch.className.split(' ').includes(cls));
    }
}
function makeSection() {
    const section = new Elem('div');
    section.classList.add('collapsible-section');
    const header = new Elem('h2');
    header.classList.add('section-header');
    const arrow = new Elem('span');
    arrow.classList.add('arrow');
    header.appendChild(arrow);
    const body = new Elem('div');
    body.classList.add('section-body');
    section.appendChild(header);
    section.appendChild(body);
    return section;
}
const active = makeSection();
const log = makeSection();
global.document = {
    querySelectorAll: sel => sel === '.collapsible-section' ? [active, log] : []
};
const SectionComponent = require('./js/ui/section_component.js');
SectionComponent.initAll();
const header = active.querySelector('.section-header');
const body = active.querySelector('.section-body');
console.log(JSON.stringify({ hidden: body.classList.contains('hidden'), collapsed: header.classList.contains('collapsed') }));
header.click();
console.log(JSON.stringify({ hidden: body.classList.contains('hidden'), collapsed: header.classList.contains('collapsed') }));
header.click();
console.log(JSON.stringify({ hidden: body.classList.contains('hidden'), collapsed: header.classList.contains('collapsed') }));
"""
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    lines = result.stdout.strip().splitlines()
    first = json.loads(lines[0])
    second = json.loads(lines[1])
    third = json.loads(lines[2])
    assert first['hidden'] is False
    assert first['collapsed'] is False
    assert second['hidden'] is True
    assert second['collapsed'] is True
    assert third['hidden'] is False
    assert third['collapsed'] is False

