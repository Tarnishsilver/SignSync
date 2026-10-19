import os

# ASL Fingerspelling alphabet in HamNoSys/SiGML format
# Each letter maps to specific hand configurations
# Reference: Hamburg Notation System (HamNoSys) for ASL alphabet

sigml_template = """<sigml>
\t<hns_sign gloss="{gloss}">
\t\t<hamnosys_nonmanual>
\t\t</hamnosys_nonmanual>
\t\t<hamnosys_manual>
{manual}
\t\t</hamnosys_manual>
\t</hns_sign>

</sigml>"""

# Accurate HamNoSys manual components for ASL fingerspelling based on standard shapes
asl_alphabet = {
    'a': '<hamfist/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'b': '<hamflathand/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'c': '<hamceeall/>\n<hamextfingeru/>\n<hampalml/>\n<hamshouldertop/>\n<hamnomotion/>',
    'd': '<hamfinger2/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'e': '<hampinchall/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'f': '<hampinch12open/><hamfingerstraightmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'g': '<hamfinger2/><hamthumboutmod/>\n<hamextfingerl/>\n<hampalmu/>\n<hamshouldertop/>\n<hamnomotion/>',
    'h': '<hamfinger23/><hamthumbacrossmod/>\n<hamextfingerl/>\n<hampalmu/>\n<hamshouldertop/>\n<hamnomotion/>',
    'i': '<hamfinger5/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'j': '<hamfinger5/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hammoved/>\n<hamarcr/>',
    'k': '<hamfinger23spread/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'l': '<hamfinger2/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'm': '<hamfist/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'n': '<hamfist/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'o': '<hampinchall/>\n<hamextfingeru/>\n<hampalml/>\n<hamshouldertop/>\n<hamnomotion/>',
    'p': '<hamfinger23spread/><hamthumboutmod/>\n<hamextfingerd/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'q': '<hamfinger2/><hamthumboutmod/>\n<hamextfingerd/>\n<hampalml/>\n<hamshouldertop/>\n<hamnomotion/>',
    'r': '<hamfinger23/><hamcrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    's': '<hamfist/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    't': '<hamfist/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'u': '<hamfinger23/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'v': '<hamfinger23spread/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'w': '<hamfinger2345/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'x': '<hamfinger2/><hamfingerhookmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'y': '<hamfinger5/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    'z': '<hamfinger2/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamzigzagd/>',
}

# Digits 0-9 HamNoSys (Basic representations)
asl_digits = {
    '0': '<hampinchall/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '1': '<hamfinger2/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '2': '<hamfinger23/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '3': '<hamfinger23/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '4': '<hamfinger2345/><hamthumbacrossmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '5': '<hamfinger2345/><hamthumboutmod/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '6': '<hampinch12open/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '7': '<hamfinger23spread/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '8': '<hamfinger234spread/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
    '9': '<hamfinger2345/>\n<hamextfingeru/>\n<hampalmd/>\n<hamshouldertop/>\n<hamnomotion/>',
}

# Output directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))

data_dir = os.path.join(PROJECT_ROOT, 'data', 'sigml')
public_dir = os.path.join(PROJECT_ROOT, 'signtube', 'public', 'avatar', 'sigml')

count = 0

# Generate letter files a-z
for letter, manual in asl_alphabet.items():
    content = sigml_template.format(gloss=letter.upper(), manual=manual)
    for d in [data_dir, public_dir]:
        filepath = os.path.join(d, f'{letter}.sigml')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    count += 1

# Generate digit files 0-9
for digit, manual in asl_digits.items():
    content = sigml_template.format(gloss=digit, manual=manual)
    for d in [data_dir, public_dir]:
        filepath = os.path.join(d, f'{digit}.sigml')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    count += 1

print(f'Created {count} sigml files (a-z + 0-9) in both data/sigml and public/avatar/sigml')
