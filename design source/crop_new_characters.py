import os
from PIL import Image

def trim_and_crop_character(image_path, output_dir, prefix):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    if not os.path.exists(image_path):
        print(f"Skipping: {image_path} does not exist.")
        return
        
    img = Image.open(image_path)
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    visited = set()
    regions = []
    
    # White background threshold
    def is_white(r, g, b):
        return r > 240 and g > 240 and b > 240

    print(f"Scanning image {image_path} for {prefix}...")
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            if (x, y) in visited:
                continue
            r, g, b, a = pixels[x, y]
            if not is_white(r, g, b) and a > 50:
                # Find bounding box using BFS
                min_x, max_x = x, x
                min_y, max_y = y, y
                queue = [(x, y)]
                visited.add((x, y))
                
                while queue:
                    cx, cy = queue.pop(0)
                    if cx < min_x: min_x = cx
                    if cx > max_x: max_x = cx
                    if cy < min_y: min_y = cy
                    if cy > max_y: max_y = cy
                    
                    for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited:
                                nr, ng, nb, na = pixels[nx, ny]
                                if not is_white(nr, ng, nb) and na > 50:
                                    visited.add((nx, ny))
                                    queue.append((nx, ny))
                
                w = max_x - min_x
                h = max_y - min_y
                # Ignore small noise
                if w > 20 and h > 20:
                    regions.append((min_x, min_y, max_x, max_y))
                    # Mark entire region as visited to avoid rescanning
                    for vy in range(min_y, max_y + 1, 2):
                        for vx in range(min_x, max_x + 1, 2):
                            visited.add((vx, vy))
                            
    print(f"Found {len(regions)} regions for {prefix}.")
    
    # We expect 6 regions in a row. Let's sort them from left to right (by X coordinate)
    # If there are more than 6, we'll sort them by area (w*h) and take the 6 largest ones, 
    # then sort those 6 by X coordinate.
    if len(regions) > 6:
        regions = sorted(regions, key=lambda r: (r[2] - r[0]) * (r[3] - r[1]), reverse=True)[:6]
        
    sorted_regions = sorted(regions, key=lambda r: r[0])
    
    for idx, rect in enumerate(sorted_regions):
        min_x, min_y, max_x, max_y = rect
        # Add a tiny padding
        pad = 4
        min_x = max(0, min_x - pad)
        min_y = max(0, min_y - pad)
        max_x = min(width, max_x + pad)
        max_y = min(height, max_y + pad)
        
        cropped = img.crop((min_x, min_y, max_x, max_y))
        
        # Transparent background conversion
        cropped = cropped.convert("RGBA")
        datas = cropped.getdata()
        newData = []
        for item in datas:
            # If color is close to white (R,G,B > 240)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)
        cropped.putdata(newData)
        
        # Output file name: player_dog_1.png etc.
        name = f"player_{prefix}_{idx + 1}.png"
        out_path = os.path.join(output_dir, name)
        cropped.save(out_path, "PNG")
        print(f"Saved: {out_path} (size: {cropped.size})")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    out_dir = r"d:\Codex\sunny\assets"
    
    # Dog
    dog_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_puppy_dog_roblox_style", "screen.png")
    trim_and_crop_character(dog_src, out_dir, "dog")
    
    # Dino
    dino_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_baby_green_dinosaur", "screen.png")
    trim_and_crop_character(dino_src, out_dir, "dino")
    
    # Penguin
    penguin_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_black_and_white", "screen.png")
    trim_and_crop_character(penguin_src, out_dir, "penguin")
