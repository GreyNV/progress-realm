import os


def test_left_panel_absent():
    path = os.path.join('index.html')
    with open(path) as f:
        html = f.read()
    assert '<div id="left"' not in html


def test_two_column_grid():
    path = os.path.join('css', 'styles.css')
    with open(path) as f:
        css = f.read()
    assert 'grid-template-columns: 2fr 1fr;' in css
