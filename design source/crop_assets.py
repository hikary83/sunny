import os
from PIL import Image

def trim_and_crop(image_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    img = Image.open(image_path)
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    visited = set()
    regions = []
    
    # White background threshold
    def is_white(r, g, b):
        return r > 240 and g > 240 and b > 240

    print("Scanning image...")
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
                if w > 15 and h > 15:
                    regions.append((min_x, min_y, max_x, max_y))
                    # Mark entire region as visited to avoid rescanning
                    for vy in range(min_y, max_y + 1, 2):
                        for vx in range(min_x, max_x + 1, 2):
                            visited.add((vx, vy))
                            
    print(f"Found {len(regions)} regions.")
    
    # Group regions into rows based on their center Y coordinate
    # Y-centers: Row 1 is ~160, Row 2 is ~400, Row 3 is ~600
    row1 = []
    row2 = []
    row3 = []
    
    for r in regions:
        center_y = (r[1] + r[3]) / 2
        if center_y < 300:
            row1.append(r)
        elif center_y < 510:
            row2.append(r)
        else:
            row3.append(r)
            
    # Sort each row by X coordinate
    row1 = sorted(row1, key=lambda r: r[0])
    row2 = sorted(row2, key=lambda r: r[0])
    row3 = sorted(row3, key=lambda r: r[0])
    
    sorted_regions = row1 + row2 + row3
    print(f"Row 1 (Characters): {len(row1)} items")
    print(f"Row 2 (Obstacles): {len(row2)} items")
    print(f"Row 3 (Items): {len(row3)} items")
    
    names = [
        # Characters (6 views)
        "player_stitch_1.png", "player_stitch_2.png", "player_stitch_3.png", 
        "player_stitch_4.png", "player_stitch_5.png", "player_stitch_6.png",
        # Obstacles (5 items)
        "obs_lifebuoy.png", "obs_beachball.png", "obs_log.png", "obs_crab.png", "obs_shark.png",
        # Upgrades (3 items)
        "item_drink.png", "item_fins.png", "item_goggles.png"
    ]
    
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
        
        name = names[idx] if idx < len(names) else f"extra_{idx}.png"
        out_path = os.path.join(output_dir, name)
        cropped.save(out_path, "PNG")
        print(f"Saved: {out_path} (size: {cropped.size})")

if __name__ == "__main__":
    src_img = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_game_asset_sheet_for_a_swimming_themed_educational\screen.png"
    out_dir = r"d:\Codex\sunny\assets"
    trim_and_crop(src_img, out_dir)
