"""
Load/save label files with explicit index numbers.
Format: one line per class, "index,word" (e.g. 0,Eat  1,Drink).
Also supports legacy one-word-per-line (line number = index).
"""
import csv
from pathlib import Path


def load_labels(path):
    """
    Load labels from CSV. Returns list of words in index order (labels[0], labels[1], ...).
    Supports:
      - "index,word" (e.g. 0,Eat)
      - "word" only (legacy: line number = index)
    """
    path = Path(path)
    if not path.exists():
        return []
    index_to_word = {}
    with open(path, encoding="utf-8-sig") as f:
        for i, row in enumerate(csv.reader(f)):
            if not row or not row[0].strip():
                continue
            if len(row) >= 2 and str(row[0]).strip().isdigit():
                idx = int(row[0].strip())
                word = row[1].strip()
            else:
                idx = i
                word = row[0].strip()
            index_to_word[idx] = word
    if not index_to_word:
        return []
    max_idx = max(index_to_word.keys())
    return [index_to_word.get(j, "") for j in range(max_idx + 1)]


def save_labels(path, labels):
    """
    Save labels as indexed lines: 0,word then 1,word ...
    labels: list of words (index = position in list)
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for index, word in enumerate(labels):
            writer.writerow([index, word])
