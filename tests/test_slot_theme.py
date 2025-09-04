import re


def test_character_layout_slot_uses_variables():
    with open('css/styles.css') as f:
        css = f.read()
    matches = re.findall(r"\.character-layout\s+\.slot\s*\{[^}]+\}", css, re.MULTILINE)
    block = next((m for m in matches if 'border' in m), None)
    assert block is not None
    assert 'border: 2px solid var(--slot-border-color);' in block
    assert 'background-color: var(--slot-bg);' in block


def test_dark_theme_defines_slot_state_vars():
    with open('css/styles.css') as f:
        css = f.read()
    match = re.search(r"body\[data-theme=\"dark\"\]\s*\{[^}]+\}", css, re.MULTILINE)
    assert match is not None
    block = match.group()
    assert '--slot-border-active:' in block
    assert '--slot-border-blocked:' in block
