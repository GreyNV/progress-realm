import os


def test_expand_arrow_margin_inline_start():
    with open(os.path.join('css', 'styles.css')) as f:
        text = f.read()
    start = text.find('.expand-arrow')
    assert start != -1
    snippet = text[start:start+80]
    assert 'margin-inline-start' in snippet
    assert 'margin-inline-end' not in snippet


def test_home_ui_expanded_state():
    with open(os.path.join('js', 'ui', 'home.js')) as f:
        text = f.read()
    assert 'expandedHomes' in text


def test_furniture_ui_expanded_state():
    with open(os.path.join('js', 'ui', 'furniture.js')) as f:
        text = f.read()
    assert 'expandedFurniture' in text
