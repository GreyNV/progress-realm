import os


def test_tab_manager_script_included():
    with open('index.html') as f:
        html = f.read()
    assert '/src/main.ts' in html


def test_tab_manager_defined():
    path = os.path.join('js', 'tab_manager.js')
    with open(path) as f:
        text = f.read()
    assert 'const TabManager' in text
    assert 'showOverview' in text
    assert 'openWorkspace' in text
    assert 'openWorkspaceSection' in text
    assert 'unlockTab' in text
    assert '__progressionService' in text
