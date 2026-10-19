"""
Build script for SignTube Chrome Extension.
Copies all required assets (CWASA engine, avatars, SiGML files, shaders) into the extension directory
and generates the SiGML index file for client-side lookup.

Usage:
    python build_extension.py
"""

import os
import shutil
import json
import glob

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
EXT_DIR = SCRIPT_DIR  # The extension directory

# Source directories
SIGNTUBE_PUBLIC = os.path.join(PROJECT_ROOT, 'signtube', 'public', 'avatar')
WEB_SIMULATOR = os.path.join(PROJECT_ROOT, 'web-simulator')
DATA_SIGML = os.path.join(PROJECT_ROOT, 'data', 'sigml')

def copy_dir(src, dst, description=""):
    """Copy directory contents, creating destination if needed."""
    if not os.path.exists(src):
        print(f"  ⚠ Source not found: {src}")
        return 0
    
    os.makedirs(dst, exist_ok=True)
    count = 0
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isfile(s):
            shutil.copy2(s, d)
            count += 1
        elif os.path.isdir(s) and item not in ['.git', 'node_modules', '__pycache__']:
            sub_count = copy_dir(s, d)
            count += sub_count
    
    if description:
        print(f"  ✓ {description}: {count} files")
    return count

def build_sigml_index():
    """Generate index.json listing all available .sigml files."""
    sigml_dir = os.path.join(EXT_DIR, 'sigml')
    if not os.path.exists(sigml_dir):
        os.makedirs(sigml_dir, exist_ok=True)
    
    sigml_files = []
    for f in os.listdir(sigml_dir):
        if f.endswith('.sigml'):
            sigml_files.append(f)
    
    sigml_files.sort()
    
    index_path = os.path.join(sigml_dir, 'index.json')
    with open(index_path, 'w', encoding='utf-8') as fp:
        json.dump(sigml_files, fp)
    
    print(f"  ✓ SiGML index: {len(sigml_files)} entries → sigml/index.json")
    return len(sigml_files)

def generate_icons():
    """Generate simple SVG icons for the extension."""
    icons_dir = os.path.join(EXT_DIR, 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in [16, 48, 128]:
        # Create a simple SVG-based PNG placeholder
        # For a real extension, replace with proper icons
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a73e8"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{size//4}" fill="url(#bg)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" 
        font-size="{size*0.5}" font-family="Arial" fill="white">🤟</text>
</svg>'''
        
        svg_path = os.path.join(icons_dir, f'icon{size}.svg')
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg)
    
    print(f"  ✓ Icons generated (SVG format)")
    print(f"    ℹ Note: For Chrome Web Store, convert SVGs to PNGs")

def main():
    print("=" * 50)
    print("  SignTube Extension Builder")
    print("=" * 50)
    print()
    
    # 1. Copy CWA engine (allcsa.js + cwasa.css + cwacfg.json)
    print("[1/5] Copying CWASA engine...")
    cwa_src = os.path.join(SIGNTUBE_PUBLIC, 'cwa')
    if not os.path.exists(cwa_src):
        cwa_src = os.path.join(WEB_SIMULATOR, 'cwa')
    copy_dir(cwa_src, os.path.join(EXT_DIR, 'avatar', 'cwa'), "CWASA engine files")
    
    # 2. Copy avatars (.jar files)
    print("[2/5] Copying avatar models...")
    avatars_src = os.path.join(SIGNTUBE_PUBLIC, 'avatars')
    if not os.path.exists(avatars_src):
        avatars_src = os.path.join(WEB_SIMULATOR, 'avatars')
    copy_dir(avatars_src, os.path.join(EXT_DIR, 'avatar', 'avatars'), "Avatar models")
    
    # 3. Copy shaders
    print("[3/5] Copying shaders...")
    shaders_src = os.path.join(SIGNTUBE_PUBLIC, 'shaders')
    if os.path.exists(shaders_src):
        copy_dir(shaders_src, os.path.join(EXT_DIR, 'avatar', 'shaders'), "Shader files")
    else:
        print("  ⚠ No shaders directory found (may not be needed)")
    
    # Copy h2s.xsl if it exists
    h2s_src = os.path.join(SIGNTUBE_PUBLIC, 'h2s.xsl')
    if os.path.exists(h2s_src):
        shutil.copy2(h2s_src, os.path.join(EXT_DIR, 'avatar', 'h2s.xsl'))
        print("  ✓ Copied h2s.xsl")
    
    # 4. Copy SiGML files
    print("[4/5] Copying SiGML files...")
    sigml_dst = os.path.join(EXT_DIR, 'sigml')
    os.makedirs(sigml_dst, exist_ok=True)
    
    # Copy from signtube public first
    sigml_src1 = os.path.join(SIGNTUBE_PUBLIC, 'sigml')
    if os.path.exists(sigml_src1):
        copy_dir(sigml_src1, sigml_dst, "SiGML from signtube/public")
    
    # Then copy from data/sigml (may have more files)
    if os.path.exists(DATA_SIGML):
        count = 0
        for f in os.listdir(DATA_SIGML):
            if f.endswith('.sigml'):
                dst_file = os.path.join(sigml_dst, f)
                if not os.path.exists(dst_file):
                    shutil.copy2(os.path.join(DATA_SIGML, f), dst_file)
                    count += 1
        print(f"  ✓ Additional SiGML from data/: {count} new files")
    
    # 5. Build SiGML index
    print("[5/5] Building SiGML index...")
    build_sigml_index()
    
    # Generate icons
    print()
    print("[Bonus] Generating icons...")
    generate_icons()
    
    # Summary
    print()
    print("=" * 50)
    print("  ✅ Build complete!")
    print("=" * 50)
    print()
    print("To load the extension in Chrome:")
    print("  1. Go to chrome://extensions/")
    print("  2. Enable 'Developer mode' (top right)")
    print("  3. Click 'Load unpacked'")
    print(f"  4. Select: {EXT_DIR}")
    print()
    print("Then open any YouTube video with captions!")
    print()

if __name__ == '__main__':
    main()
