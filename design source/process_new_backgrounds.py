import os
from PIL import Image

def find_inner_card_and_save(src_path, dest_path):
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return
        
    img = Image.open(src_path)
    img = img.convert("RGB")
    width, height = img.size
    
    # We check if this is a screenshot with dark grey background (R,G,B < 60)
    # or a direct raw 1024x1024 texture.
    # Let's count dark pixels near the top-left corner
    dark_count = 0
    for y in range(20):
        for x in range(20):
            r, g, b = img.getpixel((x, y))
            if r < 60 and g < 60 and b < 60:
                dark_count += 1
                
    # If the corner is mostly dark, it's a screenshot with chat UI background, so we crop it.
    if dark_count > 300:
        print(f"Screenshot detected for {src_path}. Cropping to card...")
        non_dark_pixels = []
        for y in range(0, height, 4):
            for x in range(0, width, 4):
                r, g, b = img.getpixel((x, y))
                if r > 60 or g > 60 or b > 60: # Non-dark
                    non_dark_pixels.append((x, y))
                    
        if non_dark_pixels:
            min_x = min(p[0] for p in non_dark_pixels)
            max_x = max(p[0] for p in non_dark_pixels)
            min_y = min(p[1] for p in non_dark_pixels)
            max_y = max(p[1] for p in non_dark_pixels)
            
            # Apply padding to remove card border
            pad = 10
            cropped = img.crop((min_x + pad, min_y + pad, max_x - pad, max_y - pad))
            cropped.save(dest_path)
            print(f"Saved: {dest_path} (cropped size: {cropped.size})")
            return
            
    # Otherwise, it's already a full texture, we copy it directly (or save as PNG)
    print(f"Full texture detected for {src_path}. Saving directly...")
    img.save(dest_path)
    print(f"Saved: {dest_path} (size: {img.size})")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    out_dir = r"d:\Codex\sunny\assets"
    
    valley_src = os.path.join(base_dir, "seamless_tileable_texture_of_a_roblox_style_mountain_valley_creek_3d_voxel", "screen.png")
    ocean_src = os.path.join(base_dir, "seamless_tileable_texture_of_a_roblox_style_deep_blue_ocean_3d_voxel_tropical", "screen.png")
    
    find_inner_card_and_save(valley_src, os.path.join(out_dir, "bg_valley.png"))
    find_inner_card_and_save(ocean_src, os.path.join(out_dir, "bg_ocean.png"))
