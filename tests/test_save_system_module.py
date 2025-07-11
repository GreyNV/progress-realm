import os


def test_save_system_script_included():
    with open('index.html') as f:
        html = f.read()
    assert 'js/save_system.js' in html


def test_save_system_defined():
    path = os.path.join('js', 'save_system.js')
    with open(path) as f:
        text = f.read()
    assert 'const SaveSystem' in text
    assert 'localStorage.setItem' in text
    assert 'localStorage.getItem' in text
    assert 'async prestige()' in text
