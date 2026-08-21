import os
from PIL import Image

def find_inner_card_and_save(src_path, dest_path):
    img = Image.open(src_path)
    img = img.convert("RGB")
    width, height = img.size
    
    # Let's count white/light pixels in each row and col to find the card
    # Usually the card has a white or very light background, OR it might be the background image itself.
    # Wait, the background image itself might not be white!
    # E.g. the water background is mostly blue/cyan, the gym background is mostly wooden brown.
    # But the card itself has a boundary! The outer background of the chat window is dark grey (R,G,B around 30).
    # So we can search for the boundary where the pixels are NOT dark grey!
    # Let's define "dark grey" of the chat UI: R < 50, G < 50, B < 50.
    # The card in the center will be colored (blue, brown, etc.) and thus NOT dark grey.
    # Let's scan and find the bounding box of pixels that are NOT dark grey (R > 60 or G > 60 or B > 60).
    
    non_dark_pixels = []
    for y in range(0, height, 4):
        for x in range(0, width, 4):
            r, g, b = img.getpixel((x, y))
            # If not dark grey
            if r > 60 or g > 60 or b > 60:
                non_dark_pixels.append((x, y))
                
    if non_dark_pixels:
        min_x = min(p[0] for p in non_dark_pixels)
        max_x = max(p[0] for p in non_dark_pixels)
        min_y = min(p[1] for p in non_dark_pixels)
        max_y = max(p[1] for p in non_dark_pixels)
        
        # Crop the card
        # Let's add some inner padding to avoid catching the card border
        pad_x = 10
        pad_y = 10
        cropped = img.crop((min_x + pad_x, min_y + pad_y, max_x - pad_x, max_y - pad_y))
        cropped.save(dest_path)
        print(f"Saved background: {dest_path} (original: {src_path}) with size: {cropped.size}")
    else:
        print(f"Failed to find background card in {src_path}")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    gym_src = os.path.join(base_dir, "roblox_style_gym_interior_background_3d_voxel_style_blocky_wooden_floor", "screen.png")
    water_src = os.path.join(base_dir, "seamless_tileable_texture_of_roblox_style_swimming_pool_water_3d_voxel_water", "screen.png")
    
    out_dir = r"d:\Codex\sunny\assets"
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    find_inner_card_and_save(gym_src, os.path.join(out_dir, "bg_gym.png"))
    find_inner_card_and_save(water_src, os.path.join(out_dir, "bg_water.png"))
