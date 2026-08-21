import shutil
import os

src = r"C:/Users/user/.gemini/antigravity/brain/33f2bbde-c678-4574-8d07-8e7a165f77aa/.user_uploaded/media_1787282997688.png"
dest_dir = r"d:\Codex\sunny\design source\raw"
dest_file = os.path.join(dest_dir, "char_boy_lv1.png")

os.makedirs(dest_dir, exist_ok=True)

try:
    shutil.copy(src, dest_file)
    print(f"Successfully copied user upload to raw folder: {dest_file}")
    
    # Run process_all_assets
    import sys
    sys.path.append(r"d:\Codex\sunny\design source")
    import process_all_assets
    process_all_assets.main()
except Exception as e:
    print(f"Error copying/processing: {e}")
