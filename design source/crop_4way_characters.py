import os
from PIL import Image

def crop_and_save_4way(image_path, output_dir, prefix):
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
    
    # We use a threshold of 215 to avoid grid lines/shadow connections
    thresh = 215
    def is_white(r, g, b):
        return r > thresh and g > thresh and b > thresh

    print(f"Scanning image {image_path} for 4-way {prefix}...")
    for y in range(0, height, 4):
        for x in range(0, width, 4):
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
                    
                    # 4-neighbors with step of 4
                    for dx, dy in [(-4, 0), (4, 0), (0, -4), (0, 4)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited:
                                nr, ng, nb, na = pixels[nx, ny]
                                if not is_white(nr, ng, nb) and na > 50:
                                    visited.add((nx, ny))
                                    queue.append((nx, ny))
                
                w = max_x - min_x
                h = max_y - min_y
                # Filter out small noise
                if w > 25 and h > 25:
                    regions.append((min_x, min_y, max_x, max_y))
                    # Mark area as visited
                    for vy in range(min_y, max_y + 1, 4):
                        for vx in range(min_x, max_x + 1, 4):
                            visited.add((vx, vy))
                            
    print(f"Found {len(regions)} raw regions for {prefix}.")
    
    # We only want the 4 largest regions
    if len(regions) < 4:
        print(f"Error: Only found {len(regions)} regions for {prefix}, expected at least 4.")
        return
        
    # Sort by size (area) to get the 4 main sprites
    regions = sorted(regions, key=lambda r: (r[2] - r[0]) * (r[3] - r[1]), reverse=True)[:4]
    
    # Determine if they are arranged in a 2x2 grid or a single row
    # Calculate Y-centers
    y_centers = [(r[1] + r[3]) / 2 for r in regions]
    min_y = min(y_centers)
    max_y = max(y_centers)
    
    sorted_regions = []
    
    if max_y - min_y < 150:
        # Single row layout: sort by X
        print(f"{prefix} layout detected: 1x4 horizontal row")
        sorted_regions = sorted(regions, key=lambda r: (r[0] + r[2]) / 2)
    else:
        # 2x2 grid layout: sort by Y, then group into rows and sort by X
        print(f"{prefix} layout detected: 2x2 grid")
        # Sort by Y first
        regions_sorted_by_y = sorted(regions, key=lambda r: (r[1] + r[3]) / 2)
        # Row 1 (first two)
        row1 = sorted(regions_sorted_by_y[:2], key=lambda r: (r[0] + r[2]) / 2)
        # Row 2 (last two)
        row2 = sorted(regions_sorted_by_y[2:], key=lambda r: (r[0] + r[2]) / 2)
        sorted_regions = row1 + row2
        
    # Standard 4 directions order
    directions = ["up", "down", "left", "right"]
    
    for idx, rect in enumerate(sorted_regions):
        min_x, min_y, max_x, max_y = rect
        # Add padding
        pad = 4
        min_x = max(0, min_x - pad)
        min_y = max(0, min_y - pad)
        max_x = min(width, max_x + pad)
        max_y = min(height, max_y + pad)
        
        cropped = img.crop((min_x, min_y, max_x, max_y))
        cropped = cropped.convert("RGBA")
        
        # Make background transparent
        datas = cropped.getdata()
        newData = []
        for item in datas:
            # If color is close to white (R,G,B > 240) or has alpha 0
            if (item[0] > 240 and item[1] > 240 and item[2] > 240) or item[3] == 0:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)
        cropped.putdata(newData)
        
        # Save as player_{prefix}_{dir}.png
        name = f"player_{prefix}_{directions[idx]}.png"
        out_path = os.path.join(output_dir, name)
        cropped.save(out_path, "PNG")
        print(f"Saved: {out_path} (size: {cropped.size})")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    out_dir = r"d:\Codex\sunny\assets"
    
    # Stitch
    stitch_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_blue_alien_hero", "screen.png")
    crop_and_save_4way(stitch_src, out_dir, "stitch")
    
    # Dog
    dog_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_puppy_dog_in_a", "screen.png")
    crop_and_save_4way(dog_src, out_dir, "dog")
    
    # Dino
    dino_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_baby_green_dinosaur_in", "screen.png")
    crop_and_save_4way(dino_src, out_dir, "dino")
    
    # Penguin
    penguin_src = os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming", "screen.png")
    crop_and_save_4way(penguin_src, out_dir, "penguin")
