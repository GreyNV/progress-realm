import json
import subprocess


def test_char_background_uses_equipped_items():
    script = r"""
class Elem {
  constructor(){ this.style = {}; }
}
const elem = new Elem();
global.document = { querySelector: () => elem };
global.PubSub = {
  events: {},
  subscribe(ev, fn){ this.events[ev] = fn; },
  publish(ev, data){ if (this.events[ev]) this.events[ev](null, data); }
};
const { CharacterBackground } = require('./js/ui/char_bg.js');
CharacterBackground.init();
const base = elem.style.backgroundImage;
PubSub.publish('inventory:changed', ['leather_armor','wooden_shield','stone_spear']);
const afterInv = elem.style.backgroundImage;
PubSub.publish('equipment:changed', ['leather_armor','wooden_shield','stone_spear']);
const spear = elem.style.backgroundImage;
PubSub.publish('equipment:changed', ['leather_armor','wooden_shield','iron_sword','gem']);
const full = elem.style.backgroundImage;
console.log(JSON.stringify([base, afterInv, spear, full]));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    images = json.loads(result.stdout.strip())
    assert images[0].endswith('new_char.png)')
    assert images[1] == images[0]
    assert images[2].endswith('leather+woodshield+spear.png)')
    assert images[3].endswith('set+sword.png)')
