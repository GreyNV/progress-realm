import os
import importlib.util
import types
import sys

IMAGES_DIR = os.path.join('assets', 'user_uploaded')


def test_uploaded_image_path_uses_forward_slashes():
    filename = "sample.png"
    file_path = os.path.join(IMAGES_DIR, filename)
    file_path = file_path.replace(os.sep, "/")
    assert "/" in file_path
    assert "\\" not in file_path


def load_bot():
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
    return module


def test_sanitized_filename():
    module = load_bot()
    assert module.sanitize_filename("Stone Spear", "img.JPG") == "stone_spear.jpg"

