import os


def test_format_cost_util():
    with open(os.path.join('js', 'utils.js')) as f:
        text = f.read()
    assert 'formatCost' in text
    with open(os.path.join('js', 'ui', 'home.js')) as f:
        home_text = f.read()
    assert 'Utils.formatCost' in home_text
    assert 'function formatCost' not in home_text
    with open(os.path.join('js', 'ui', 'furniture.js')) as f:
        furn_text = f.read()
    assert 'Utils.formatCost' in furn_text
    assert 'function formatCost' not in furn_text
