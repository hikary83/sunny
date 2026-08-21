import os
from PIL import Image

def inspect_raw(image_path, prefix):
    if not os.path.exists(image_path):
        print(f"{prefix}: Image not found at {image_path}")
        return
        
    img = Image.open(image_path)
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    visited = set()
    regions = []
    
    def is_white(r, g, b):
        return r > 240 and g > 240 and b > 240

    for y in range(0, height, 2):
        for x in range(0, width, 2):
            if (x, y) in visited:
                continue
            r, g, b, a = pixels[x, y]
            if not is_white(r, g, b) and a > 50:
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
                if w > 20 and h > 20:
                    regions.append((min_x, min_y, max_x, max_y))
                    # Mark area as visited
                    for vy in range(min_y, max_y + 1, 2):
                        for vx in range(min_x, max_x + 1, 2):
                            visited.add((vx, vy))
                            
    print(f"--- {prefix} ---")
    print(f"Total raw regions found: {len(regions)}")
    for idx, r in enumerate(regions):
        w = r[2] - r[0]
        h = r[3] - r[1]
        print(f"Region {idx}: x={r[0]} to {r[2]} (w={w}), y={r[1]} to {r[3]} (h={h})")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    
    inspect_raw(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_blue_alien_hero", "screen.png"), "Stitch")
    inspect_raw(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_puppy_dog_in_a", "screen.png"), "Dog")
    inspect_raw(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_baby_green_dinosaur_in", "screen.png"), "Dino")
    inspect_raw(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming", "screen.png"), "Penguin")
