import json
import os
import shutil
from deep_translator import GoogleTranslator

# setup translater
translator = GoogleTranslator(source='ar', target='en')

directories_to_update = [
    r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\data',
    r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\web-simulator'
]

# Read original JSON
json_path = os.path.join(directories_to_update[0], 'categories_files.json')
with open(json_path, 'r', encoding='utf-8') as f:
    categories = json.load(f)

new_categories = {}
translate_map = {}

for ar_cat, ar_words in categories.items():
    en_cat = translator.translate(ar_cat)
    if not en_cat: en_cat = ar_cat
    en_cat = en_cat.strip()
    
    new_categories[en_cat] = []
    
    for ar_word in ar_words:
        # Check if it's already a number or english
        if ar_word.isdigit():
            en_word = ar_word
        else:
            en_word = translator.translate(ar_word)
            if not en_word: en_word = ar_word
        
        # Replace spaces in english with underscores, or keep spaces.
        # But wait, original sigmls had spaces (e.g., "أحسنت.sigml" vs "من فضلك.sigml").
        # We can keep spaces, but convert to lower case for consistency.
        en_word = en_word.strip().lower()
        
        # In case of duplicates mapping to same english word, append a number
        original_en_word = en_word
        count = 1
        while en_word in translate_map.values() and translate_map.get(ar_word) != en_word:
            en_word = f"{original_en_word}_{count}"
            count += 1
            
        translate_map[ar_word] = en_word
        new_categories[en_cat].append(en_word)

# Function to rename files in a given sigml folder
def rename_sigml_files(sigml_dir):
    if not os.path.exists(sigml_dir):
        print(f"Directory not found: {sigml_dir}")
        return
        
    for ar_word, en_word in translate_map.items():
        ar_file = os.path.join(sigml_dir, f"{ar_word}.sigml")
        en_file = os.path.join(sigml_dir, f"{en_word}.sigml")
        
        if os.path.exists(ar_file):
            print(f"Renaming {ar_file} -> {en_file}")
            # we should avoid collision
            if ar_file != en_file:
                shutil.move(ar_file, en_file)
        else:
            print(f"File missing: {ar_file}")

# Apply renaming
for base_dir in directories_to_update:
    sigml_dir = os.path.join(base_dir, 'sigml')
    rename_sigml_files(sigml_dir)
    
    # Save the updated JSON back out
    out_json = os.path.join(base_dir, 'categories_files.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(new_categories, f, indent=4, ensure_ascii=False)

print("Translation and renaming complete.")
