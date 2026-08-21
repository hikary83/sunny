import sys
import os
from PIL import Image

def make_transparent_and_crop(input_path, output_name):
    # Ensure output folder exists
    assets_dir = r"d:\Codex\sunny\assets"
    os.makedirs(assets_dir, exist_ok=True)
    output_path = os.path.join(assets_dir, output_name)

    print(f"Loading image from: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    # Threshold for white background
    threshold = 245
    
    for item in datas:
        # If pixel is very close to white, make it transparent
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Find bounding box of non-transparent content to crop cleanly
    bbox = img.getbbox()
    if bbox:
        # Add a tiny padding
        padding = 10
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        
        cropped_img = img.crop((left, top, right, bottom))
        print(f"Cropped from {img.size} to {cropped_img.size}")
        cropped_img.save(output_path, "PNG")
    else:
        img.save(output_path, "PNG")
        
    print(f"Successfully saved transparent cropped asset to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_generated_asset.py [input_path] [output_name]")
        sys.exit(1)
        
    make_transparent_and_crop(sys.argv[1], sys.argv[2])
