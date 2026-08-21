import os
from PIL import Image

def process_image(input_path, output_path):
    print(f"Processing: {input_path} -> {output_path}")
    img = Image.open(input_path).convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    # Threshold for solid white background removal
    threshold = 245
    
    for item in datas:
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Bounding box crop
    bbox = img.getbbox()
    if bbox:
        padding = 10
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        
        cropped_img = img.crop((left, top, right, bottom))
        cropped_img.save(output_path, "PNG")
    else:
        img.save(output_path, "PNG")

def main():
    raw_dir = r"d:\Codex\sunny\design source\raw"
    assets_dir = r"d:\Codex\sunny\assets"
    
    os.makedirs(assets_dir, exist_ok=True)
    
    # The identified mapping of Stitch folder suffixes to target filenames
    mapping = {
        "1": "char_boy_lv1.png",
        "2": "char_boy_lv5.png",
        "3": "char_girl_lv3.png",
        "4": "char_girl_lv1.png",
        "5": "char_boy_lv3.png",
        "6": "char_girl_lv5.png",
        "7": "char_boy_lv7.png",
        "8": "char_girl_lv7.png",
        "9": "char_boy_lv10.png",
        "10": "char_girl_lv10.png"
    }
    
    processed_count = 0
    
    for suffix, target_name in mapping.items():
        folder_name = f"cute_3d_cartoon_game_asset_subway_surfers_style_bright_vibrant_colors_smooth_{suffix}"
        input_path = os.path.join(raw_dir, folder_name, "screen.png")
        output_path = os.path.join(assets_dir, target_name)
        
        if os.path.exists(input_path):
            try:
                process_image(input_path, output_path)
                processed_count += 1
            except Exception as e:
                print(f"Error processing folder suffix {suffix}: {e}")
        else:
            print(f"File not found: {input_path}")
            
    print(f"Finished! Processed {processed_count} out of {len(mapping)} assets successfully.")

if __name__ == "__main__":
    main()
