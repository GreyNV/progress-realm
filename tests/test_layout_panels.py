import os


def test_left_panel_present():
    path = os.path.join('index.html')
    with open(path) as f:
        html = f.read()
    assert '<div id="left"' in html


def test_three_column_grid():
    path = os.path.join('css', 'styles.css')
    with open(path) as f:
        css = f.read()
    assert 'grid-template-columns: minmax(180px, 1fr) 2fr minmax(180px, 1fr);' in css
