import json
import os
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

DATA_DIR = Path('data')
DOCS_DIR = Path('docs') / 'analytics'
DOCS_DIR.mkdir(exist_ok=True)

files = {
    'Items': DATA_DIR / 'items.json',
    'Actions': DATA_DIR / 'actions.json',
    'Encounters': DATA_DIR / 'encounters.json',
    'Tasks': DATA_DIR / 'tasks.json',
    'Locations': DATA_DIR / 'locations.json',
}

def load_json(path):
    with open(path) as f:
        return json.load(f)

# Load data into DataFrames
frames = {name: pd.json_normalize(load_json(path)) for name, path in files.items()}

# Write Excel workbook
excel_path = DOCS_DIR / 'game_data.xlsx'
with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
    for sheet, df in frames.items():
        df.to_excel(writer, sheet_name=sheet, index=False)
print(f"Wrote {excel_path}")

# Simple graphs
# Items by rarity
if 'Items' in frames:
    rarity_counts = frames['Items']['rarity'].value_counts()
    rarity_counts.plot(kind='bar', title='Item Rarity Distribution')
    plt.tight_layout()
    plt.savefig(DOCS_DIR / 'items_by_rarity.png')
    plt.clf()

# Encounters by rarity
if 'Encounters' in frames:
    enc_counts = frames['Encounters']['rarity'].value_counts()
    enc_counts.plot(kind='bar', title='Encounter Rarity Distribution', color='orange')
    plt.tight_layout()
    plt.savefig(DOCS_DIR / 'encounters_by_rarity.png')
    plt.clf()

# Action resource consumption totals
if 'Actions' in frames:
    def total_consumption(row):
        rc = row.get('resourceConsumption', {})
        if isinstance(rc, str):
            try:
                rc = json.loads(rc)
            except Exception:
                rc = {}
        return sum(rc.values()) if rc else 0

    consumptions = frames['Actions'].apply(total_consumption, axis=1)
    plt.bar(frames['Actions']['name'], consumptions)
    plt.title('Total Resource Consumption per Action')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(DOCS_DIR / 'action_consumption.png')
    plt.clf()
