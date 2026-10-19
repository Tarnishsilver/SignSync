"""
Setup script for the SignSync frontend.
Copies CWASA avatar engine, avatar models, and SiGML files into public/avatar/.
Also generates the sigml-index.json used by the MeetingAvatar component.

Usage: python setup_avatar.py
"""

import os
import shutil
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PUBLIC_AVATAR = os.path.join(SCRIPT_DIR, 'public', 'avatar')

# Source directories
SIGNTUBE_AVATAR = os.path.join(PROJECT_ROOT, 'signtube', 'public', 'avatar')
WEB_SIMULATOR = os.path.join(PROJECT_ROOT, 'web-simulator')
DATA_SIGML = os.path.join(PROJECT_ROOT, 'data', 'sigml')

def copy_dir(src, dst, desc=""):
    if not os.path.exists(src):
        print(f"  ⚠ Not found: {src}")
        return 0
    os.makedirs(dst, exist_ok=True)
    count = 0
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isfile(s):
            shutil.copy2(s, d)
            count += 1
    if desc:
        print(f"  ✓ {desc}: {count} files")
    return count

def main():
    print("=" * 50)
    print("  SignSync Frontend — Avatar Setup")
    print("=" * 50)
    print()

    os.makedirs(PUBLIC_AVATAR, exist_ok=True)

    # 1. Copy CWA engine
    print("[1/5] Copying CWASA engine...")
    cwa_src = os.path.join(SIGNTUBE_AVATAR, 'cwa')
    if not os.path.exists(cwa_src):
        cwa_src = os.path.join(WEB_SIMULATOR, 'cwa')
    copy_dir(cwa_src, os.path.join(PUBLIC_AVATAR, 'cwa'), "CWA engine")

    # 2. Copy avatars
    print("[2/5] Copying avatar models...")
    av_src = os.path.join(SIGNTUBE_AVATAR, 'avatars')
    if not os.path.exists(av_src):
        av_src = os.path.join(WEB_SIMULATOR, 'avatars')
    copy_dir(av_src, os.path.join(PUBLIC_AVATAR, 'avatars'), "Avatar models")

    # 3. Copy shaders
    print("[3/5] Copying shaders...")
    sh_src = os.path.join(SIGNTUBE_AVATAR, 'shaders')
    if os.path.exists(sh_src):
        copy_dir(sh_src, os.path.join(PUBLIC_AVATAR, 'shaders'), "Shaders")

    # Copy h2s.xsl
    h2s = os.path.join(SIGNTUBE_AVATAR, 'h2s.xsl')
    if os.path.exists(h2s):
        shutil.copy2(h2s, os.path.join(PUBLIC_AVATAR, 'h2s.xsl'))
        print("  ✓ h2s.xsl")

    # Copy cwaclientcfg.json
    cfg = os.path.join(SIGNTUBE_AVATAR, 'cwaclientcfg.json')
    if os.path.exists(cfg):
        shutil.copy2(cfg, os.path.join(PUBLIC_AVATAR, 'cwaclientcfg.json'))
        print("  ✓ cwaclientcfg.json")

    # Copy index.html (avatar engine page)
    idx = os.path.join(SIGNTUBE_AVATAR, 'index.html')
    if os.path.exists(idx):
        shutil.copy2(idx, os.path.join(PUBLIC_AVATAR, 'index.html'))
        print("  ✓ index.html")

    # 4. Copy SiGML files
    print("[4/5] Copying SiGML files...")
    sigml_dst = os.path.join(PUBLIC_AVATAR, 'sigml')
    os.makedirs(sigml_dst, exist_ok=True)

    # From signtube public
    sigml_src1 = os.path.join(SIGNTUBE_AVATAR, 'sigml')
    if os.path.exists(sigml_src1):
        copy_dir(sigml_src1, sigml_dst, "SiGML from signtube")

    # From data/sigml (additional)
    if os.path.exists(DATA_SIGML):
        count = 0
        for f in os.listdir(DATA_SIGML):
            if f.endswith('.sigml'):
                d = os.path.join(sigml_dst, f)
                if not os.path.exists(d):
                    shutil.copy2(os.path.join(DATA_SIGML, f), d)
                    count += 1
        print(f"  ✓ Additional from data/sigml: {count} new files")

    # 5. Generate SiGML index
    print("[5/5] Generating SiGML index...")
    sigml_files = sorted([f for f in os.listdir(sigml_dst) if f.endswith('.sigml')])
    index_path = os.path.join(PUBLIC_AVATAR, 'sigml-index.json')
    with open(index_path, 'w', encoding='utf-8') as fp:
        json.dump(sigml_files, fp)
    print(f"  ✓ Index: {len(sigml_files)} entries → public/avatar/sigml-index.json")

    print()
    print("=" * 50)
    print("  ✅ Avatar setup complete!")
    print("=" * 50)

if __name__ == '__main__':
    main()
