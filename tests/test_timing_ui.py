def test_routine_widgets_show_completion_time_and_remaining_time():
    with open('src/ui/widgets.ts', encoding='utf-8') as f:
        text = f.read()
    assert 'Completion Time' in text
    assert 'Time Left' in text
    assert 'getActionEffectiveDuration' in text


def test_dungeon_cards_show_completion_time():
    with open('src/ui/encounter.ts', encoding='utf-8') as f:
        text = f.read()
    assert 'getDungeonAverageDuration' in text
    assert 'Completion Time' in text
