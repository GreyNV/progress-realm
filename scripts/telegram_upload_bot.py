"""Telegram bot for uploading missing assets."""

import json
import os
import subprocess
import shutil
import logging
import re
from typing import List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ConversationHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

DATA_FILES = [
    os.path.join('data', 'items.json'),
    os.path.join('data', 'encounters.json'),
    os.path.join('data', 'homes.json'),
]
IMAGES_DIR = os.path.join('assets', 'user_uploaded')
BRANCH_NAME = 'bot/assets-upload'

SELECT_ITEM, RECEIVE_IMAGE = range(2)


def sanitize_filename(entry_id: str, original_name: str) -> str:
    """Return a lowercase filename based on the entry id."""
    name = re.sub(r"[^a-z0-9]+", "_", entry_id.lower()).strip("_")
    ext = os.path.splitext(original_name)[1].lower() or ".png"
    return f"{name}{ext}"


def git_pull() -> Tuple[bool, str]:
    """Pull the latest changes from origin/main."""
    try:
        subprocess.run(['git', 'pull', 'origin', 'main'], check=True)
        return True, 'Repository updated.'
    except subprocess.CalledProcessError as exc:
        return False, str(exc)


def find_unresolved() -> List[Tuple[str, str, str]]:
    """Return list of (file, id, name) entries missing images."""
    unresolved: List[Tuple[str, str, str]] = []
    for path in DATA_FILES:
        with open(path, 'r', encoding='utf-8') as f:
            entries = json.load(f)
        for entry in entries:
            img = entry.get('image')
            if not img or not os.path.exists(img):
                unresolved.append((path, entry.get('id', ''), entry.get('name', 'Unnamed')))
    return unresolved


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send basic help message."""
    await update.message.reply_text(
        'Send /upload_image to add an asset or /list_unresolved to view pending items.'
    )


async def list_unresolved(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List entries without images."""
    success, msg = git_pull()
    if not success:
        await update.message.reply_text(f'Git pull failed: {msg}')
        return
    unresolved = find_unresolved()
    if not unresolved:
        await update.message.reply_text('All items have images!')
        return
    text_lines = [f"{u[1]}: {u[2]}" for u in unresolved[:10]]
    reply = '\n'.join(text_lines)
    if len(unresolved) > 10:
        reply += f"\n...and {len(unresolved) - 10} more"
    await update.message.reply_text(reply)


async def upload_image(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Begin upload flow by presenting unresolved entries."""
    unresolved = find_unresolved()
    if not unresolved:
        await update.message.reply_text('Nothing to upload.')
        return ConversationHandler.END
    buttons = [InlineKeyboardButton(u[2], callback_data=str(idx)) for idx, u in enumerate(unresolved[:10])]
    markup = InlineKeyboardMarkup.from_column(buttons)
    context.user_data['unresolved'] = unresolved
    await update.message.reply_text('Select item to upload image for:', reply_markup=markup)
    return SELECT_ITEM


async def select_item(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle selected entry and ask for image."""
    query = update.callback_query
    await query.answer()
    index = int(query.data)
    unresolved = context.user_data.get('unresolved', [])
    if index >= len(unresolved):
        await query.edit_message_text('Invalid selection.')
        return ConversationHandler.END
    context.user_data['selected'] = unresolved[index]
    await query.edit_message_text(f'Send image for {unresolved[index][2]}')
    return RECEIVE_IMAGE


async def receive_image(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive file, validate and commit."""
    document = update.message.document
    photos = update.message.photo or []
    tg_file = None
    filename = ''

    if document:
        tg_file = document
        filename = document.file_name
    elif photos:
        tg_file = photos[-1]
        filename = f"{tg_file.file_unique_id}.jpg"
    else:
        await update.message.reply_text('Please send a valid image file.')
        return RECEIVE_IMAGE

    if not os.path.isdir(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    data_file, entry_id, entry_name = context.user_data.get('selected')
    filename = sanitize_filename(entry_id or entry_name, filename)
    file_path = os.path.join(IMAGES_DIR, filename)
    file_path = file_path.replace(os.sep, "/")
    file = await tg_file.get_file()
    await file.download_to_drive(custom_path=file_path)
    if os.path.getsize(file_path) > 5 * 1024 * 1024:
        await update.message.reply_text('File too large. 5MB max.')
        os.remove(file_path)
        return RECEIVE_IMAGE
    data_file, entry_id, _ = context.user_data.get('selected')
    with open(data_file, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    for entry in entries:
        if entry.get('id') == entry_id:
            entry['image'] = file_path
            break
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2)
    commit_and_pr(file_path, data_file, entry_id)
    await update.message.reply_text(f'✅ Image for {entry_id} added!')
    return ConversationHandler.END


def commit_and_pr(image_path: str, data_file: str, entry_id: str) -> None:
    """Commit the new asset and create or update a PR."""
    subprocess.run(['git', 'checkout', '-B', BRANCH_NAME], check=False)
    subprocess.run(['git', 'add', image_path, data_file], check=True)
    subprocess.run(['git', 'commit', '-m', f'Add image for {entry_id}'], check=True)
    subprocess.run(['git', 'push', 'origin', BRANCH_NAME], check=True)
    if shutil.which('gh') is None:
        logger.info('gh CLI not found; skipping pull request creation.')
        return
    result = subprocess.run(
        ['gh', 'pr', 'list', '--head', BRANCH_NAME, '--state', 'open'],
        capture_output=True,
        text=True,
    )
    if not result.stdout.strip():
        subprocess.run(['gh', 'pr', 'create', '--fill'], check=False)


def main() -> None:
    token = os.environ.get('TELEGRAM_API_KEY')
    if not token:
        raise RuntimeError('TELEGRAM_API_KEY not set')
    app = ApplicationBuilder().token(token).build()
    conv = ConversationHandler(
        entry_points=[CommandHandler('upload_image', upload_image)],
        states={
            SELECT_ITEM: [CallbackQueryHandler(select_item)],
            RECEIVE_IMAGE: [MessageHandler(filters.ALL, receive_image)],
        },
        fallbacks=[],
    )
    app.add_handler(CommandHandler('start', start))
    app.add_handler(CommandHandler('list_unresolved', list_unresolved))
    app.add_handler(conv)
    app.run_polling()


if __name__ == '__main__':
    main()
