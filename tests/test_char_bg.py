import json
import subprocess


def test_char_background_uses_equipped_items():
    script = r"""
const { CharacterBackground } = require('./js/ui/char_bg.js');
CharacterBackground.container = { style: {} };
CharacterBackground.update([]);
const base = CharacterBackground.container.style.backgroundImage;
CharacterBackground.container = { style: {} };
CharacterBackground.update(['leather_armor','wooden_shield','stone_spear']);
const spear = CharacterBackground.container.style.backgroundImage;
CharacterBackground.container = { style: {} };
CharacterBackground.update(['leather_armor','wooden_shield','iron_sword','gem']);
const full = CharacterBackground.container.style.backgroundImage;
console.log(JSON.stringify([base, spear, full]));
""";
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True)
    images = json.loads(result.stdout.strip())
    assert images[0].endswith('new_char.png)')
    assert images[1].endswith('leather+woodshield+spear.png)')
    assert images[2].endswith('set+sword.png)')
