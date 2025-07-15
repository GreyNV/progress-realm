import os


def test_tab_manager_script_included():
    with open('index.html') as f:
        html = f.read()
    assert 'js/tab_manager.js' in html


def test_tab_manager_defined():
    path = os.path.join('js', 'tab_manager.js')
    with open(path) as f:
        text = f.read()
    assert 'const TabManager' in text
    assert 'showTab' in text
    assert 'unlockTab' in text
