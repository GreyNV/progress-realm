import importlib.util
import os
import sys
import types

# Create dummy telegram modules to satisfy imports
telegram = types.ModuleType("telegram")
telegram.Update = object
telegram.InlineKeyboardButton = object
telegram.InlineKeyboardMarkup = object
sys.modules["telegram"] = telegram

telegram_ext = types.ModuleType("telegram.ext")
telegram_ext.ApplicationBuilder = object
telegram_ext.CallbackQueryHandler = object
telegram_ext.CommandHandler = object
telegram_ext.ConversationHandler = object
telegram_ext.ContextTypes = types.SimpleNamespace(DEFAULT_TYPE=object())
telegram_ext.MessageHandler = object
telegram_ext.filters = object
sys.modules["telegram.ext"] = telegram_ext

spec = importlib.util.spec_from_file_location(
    "telegram_upload_bot", os.path.join("scripts", "telegram_upload_bot.py")
)
bot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bot)


def test_image_path_normalization(monkeypatch):
    monkeypatch.setattr(bot.os, "sep", "\\")
    monkeypatch.setattr(bot.os.path, "join", lambda a, b: f"{a}\\{b}")

    filename = "image.png"
    file_path = bot.os.path.join(bot.IMAGES_DIR, filename)
    file_path = file_path.replace(bot.os.sep, "/")
    entry = {"image": file_path}

    assert entry["image"] == "assets/user_uploaded/image.png"
    assert "\\" not in entry["image"]
