import json
import importlib.util
import types
import os
import sys
import subprocess
import shutil


spec = importlib.util.spec_from_file_location(
    "telegram_upload_bot",
    os.path.join("scripts", "telegram_upload_bot.py"),
)
telegram = types.ModuleType("telegram")
telegram.Update = object
telegram.InlineKeyboardButton = object
telegram.InlineKeyboardMarkup = object
telegram.ext = types.ModuleType("telegram.ext")
for name in [
    "ApplicationBuilder",
    "CallbackQueryHandler",
    "CommandHandler",
    "ConversationHandler",
    "MessageHandler",
]:
    setattr(telegram.ext, name, object())
telegram.ext.ContextTypes = types.SimpleNamespace(DEFAULT_TYPE=object())
telegram.ext.filters = types.SimpleNamespace(ALL=object())
sys.modules["telegram"] = telegram
sys.modules["telegram.ext"] = telegram.ext
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Dummy:
    def __init__(self):
        self.stdout = ""


def test_find_unresolved_includes_story(tmp_path, monkeypatch):
    items = tmp_path / "items.json"
    story = tmp_path / "story_events.json"
    json.dump([{"id": "i1", "name": "Item", "image": ""}], items.open("w"))
    json.dump([{"id": "s1", "name": "Story", "image": ""}], story.open("w"))
    monkeypatch.setattr(module, "DATA_FILES", [str(items), str(story)])
    unresolved = module.find_unresolved()
    assert (str(story), "s1", "Story") in unresolved
    assert (str(items), "i1", "Item") in unresolved


def test_commit_and_pr_runs_gh(monkeypatch):
    calls = []
    def fake_run(cmd, *args, **kwargs):
        calls.append(cmd)
        return Dummy()

    monkeypatch.setattr(subprocess, 'run', fake_run)
    monkeypatch.setattr(shutil, 'which', lambda x: '/usr/bin/gh')
    module.commit_and_pr('img.png', 'data.json', 'id1')
    assert any(cmd[0] == 'gh' for cmd in calls)


def test_find_unresolved_story_uses_fallback(tmp_path, monkeypatch):
    story = tmp_path / "story_events.json"
    json.dump([
        {"id": "s2", "textKey": "storyKey", "image": ""}
    ], story.open("w"))
    monkeypatch.setattr(module, "DATA_FILES", [str(story)])
    unresolved = module.find_unresolved()
    assert (str(story), "s2", "storyKey") in unresolved


def test_find_unresolved_includes_homes(tmp_path, monkeypatch):
    homes = tmp_path / "homes.json"
    json.dump([
        {"id": "h1", "name": "Home", "image": ""}
    ], homes.open("w"))
    monkeypatch.setattr(module, "DATA_FILES", [str(homes)])
    unresolved = module.find_unresolved()
    assert (str(homes), "h1", "Home") in unresolved
