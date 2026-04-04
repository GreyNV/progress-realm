import os


def test_story_script_included():
    with open('index.html') as f:
        text = f.read()
    assert '/src/main.ts' in text


def test_story_system_defined():
    path = os.path.join('js', 'story.js')
    with open(path) as f:
        content = f.read()
    assert 'const StorySystem' in content
