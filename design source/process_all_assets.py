import os
import glob
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
    
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(assets_dir, exist_ok=True)
    
    # Find all jpg/png in raw directory
    extensions = ["*.jpg", "*.jpeg", "*.png"]
    files_to_process = []
    for ext in extensions:
        files_to_process.extend(glob.glob(os.path.join(raw_dir, ext)))
        
    if not files_to_process:
        print(f"No files found in {raw_dir}!")
        print("Please save your generated JPG/PNG images there first.")
        print("Example filenames: char_boy_lv1.jpg, bg_gym.png, item_fins.jpg")
        return
        
    for file_path in files_to_process:
        filename = os.path.basename(file_path)
        # Change extension to .png
        name_part, _ = os.path.splitext(filename)
        output_filename = name_part + ".png"
        output_path = os.path.join(assets_dir, output_filename)
        
        try:
            process_image(file_path, output_path)
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    main()
