import os
import shutil

input_file = r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\data\missing_words.txt'
data_sigml_dir = r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\data\sigml'
public_sigml_dir = r'c:\Users\Archana\OneDrive\Desktop\algerianSignLanguage-avatar\signtube\public\avatar\sigml'

# Ensure directories exist
os.makedirs(data_sigml_dir, exist_ok=True)
os.makedirs(public_sigml_dir, exist_ok=True)

import random

# Various hand shapes
hand_shapes = [
    '<hamfist/>', '<hampinch12/>', '<hamflathand/>', '<hamcee12/>',
    '<hamindexfinger/>', '<hamfist/><hamthumboutmod/>', '<hampinchall/>',
    '<hamceeopen/>', '<hamcee12open/>', '<hamextfingerui/>', '<hamfinger23spread/>',
    '<hamfinger2345/>', '<hampinch12open/>', '<hamfinger2/>'
]

# Various palm orientations
palm_orientations = [
    '<hampalml/>', '<hampalmr/>', '<hampalmu/>', '<hampalmd/>', '<hampalmu/>', '<hampalmuo/>'
]

# Various finger directions
finger_directions = [
    '<hamextfingeru/>', '<hamextfingero/>', '<hamextfingerl/>', '<hamextfingerr/>', 
    '<hamextfingeruo/>', '<hamextfingerdo/>', '<hamextfingerui/>'
]

# Various locations (where the hand moves to/spawns)
locations = [
    '<hamchest/>', '<hamshoulders/>', '<hamstomach/>', '<hamhead/>', '<hamneck/>',
    '<hambelowstomach/>', '<hamlrat/>', '<hamchin/>', '<hamlips/>', '<hamnose/>', '<hamshouldertop/>'
]

# Various movements
movements = [
    '<hammoveu/>', '<hammoved/>', '<hammovel/>', '<hammover/>',
    '<hammoveo/>', '<hammovei/>', '<hamnomotion/>', '<hamcircleo/>',
    '<hamcirclel/>', '<hamcircler/>', '<hamarcd/>', '<hamarcu/>',
    '<hamzigzagu/>', '<hamzigzagd/>', '<hamwavy/>'
]

# Additional modifiers (fast, slow, tense, repeated)
modifiers = [
    '<hamfast/>', '<hamslow/>', '<hamrepeatfromstart/>', '<hamrepeatcontinuesweep/>', ''
]

def generate_random_sigml(word: str) -> str:
    # Seed random generator with the word itself 
    # so the same word always gets the same unique sign!
    random.seed(word)
    
    # Are we using a two-handed symmetric sign?
    two_handed_str = ""
    is_two_handed = random.random() > 0.5
    if is_two_handed:
        two_handed_str = "<hamsymmlr/> <hamparbegin/>"
        
    shape = random.choice(hand_shapes)
    palm = random.choice(palm_orientations)
    finger = random.choice(finger_directions)
    loc = random.choice(locations)
    move = random.choice(movements)
    mod = random.choice(modifiers)
    
    # If two handed, end the parallel execution after the sign structure
    two_handed_end = "<hamparend/>" if is_two_handed else ""
    
    manual_block = f"{two_handed_str} {shape} {finger} {palm} {loc} {two_handed_end} {move} {mod}"
    
    return f"""<?xml version="1.0" encoding="utf-8"?>
<sigml>
  <hns_sign gloss="{word}">
    <hamnosys_nonmanual>
      <hnm_mouthpicture picture="{word}"/>
    </hamnosys_nonmanual>
    <hamnosys_manual>
      {manual_block}
    </hamnosys_manual>
  </hns_sign>
</sigml>
"""

# Reset seed so we don't interfere with other scripts if imported
random.seed()

created_count = 0

if os.path.exists(input_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        words = [line.strip().lower() for line in f if line.strip()]

    # Deduplicate
    unique_words = list(set(words))

    for raw_word in unique_words:
        # Sanitize word for filename (remove punctuation)
        safe_word = ''.join(c for c in raw_word if c.isalnum())
        if not safe_word:
            continue

        data_path = os.path.join(data_sigml_dir, f'{safe_word}.sigml')
        public_path = os.path.join(public_sigml_dir, f'{safe_word}.sigml')
        
        # If the file doesn't already exist, create it
        if not os.path.exists(data_path):
            xml_content = generate_random_sigml(word=raw_word)
            with open(data_path, 'w', encoding='utf-8') as f:
                f.write(xml_content)
            
            # Copy to public directory so the iframe can access it immediately
            shutil.copy2(data_path, public_path)
            created_count += 1
            
    # Clear the file since we made the sigmls
    if created_count > 0 or len(unique_words) > 0:
        open(input_file, 'w').close()

    print(f'Created {created_count} new .sigml files from {len(unique_words)} unique missing words.')
else:
    print('missing_words.txt not found.')
