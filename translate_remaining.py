import os
import shutil

translations = {
    "أحسب": "i_calculate",
    "أختار": "i_choose",
    "أعلم": "i_know",
    "الآنسة": "the_miss",
    "عالِم": "scientist",
    "كحول": "alcohol",
    "لا أعلم": "i_dont_know",
    "نفس": "same_as"
}

directories_to_update = [
    r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\data',
    r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\web-simulator'
]

def rename_sigml_files(sigml_dir):
    if not os.path.exists(sigml_dir):
        return
    for ar_filename in os.listdir(sigml_dir):
        if not ar_filename.endswith('.sigml'):
            continue
        base = ar_filename[:-6]
        if base in translations:
            en_word = translations[base]
            src = os.path.join(sigml_dir, ar_filename)
            dst = os.path.join(sigml_dir, f"{en_word}.sigml")
            shutil.move(src, dst)

for base_dir in directories_to_update:
    sigml_dir = os.path.join(base_dir, 'sigml')
    rename_sigml_files(sigml_dir)

print("Remaining files renamed successfully!")
