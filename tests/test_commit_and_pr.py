import subprocess
import shutil
import importlib.util
import os
import types
import sys

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
commit_and_pr = module.commit_and_pr

class Dummy:
    def __init__(self):
        self.stdout = ''

def test_skip_pr_when_gh_missing(monkeypatch):
    calls = []
    def fake_run(cmd, *args, **kwargs):
        calls.append(cmd)
        return Dummy()
    monkeypatch.setattr(subprocess, 'run', fake_run)
    monkeypatch.setattr(shutil, 'which', lambda x: None)
    commit_and_pr('img.png', 'data.json', 'id1')
    assert not any(cmd[0] == 'gh' for cmd in calls)

