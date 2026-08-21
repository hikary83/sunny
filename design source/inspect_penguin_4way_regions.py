from PIL import Image

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming\screen.png")
img = img.convert("RGBA")
width, height = img.size
pixels = img.load()
visited = set()
regions = []

thresh = 215
def is_white(r, g, b):
    return r > thresh and g > thresh and b > thresh

for y in range(0, height, 4):
    for x in range(0, width, 4):
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
            if w > 20 and h > 20:
                regions.append((min_x, min_y, max_x, max_y))
                for vy in range(min_y, max_y + 1, 4):
                    for vx in range(min_x, max_x + 1, 4):
                        visited.add((vx, vy))

# Sort by Y first, then group by Y to check layout
regions = sorted(regions, key=lambda r: (r[1] + r[3])/2)
print("Detected Penguin regions:")
for idx, r in enumerate(regions):
    w = r[2] - r[0]
    h = r[3] - r[1]
    cx = (r[0] + r[2])/2
    cy = (r[1] + r[3])/2
    print(f"Region {idx}: Center=({cx}, {cy}), Box=({r[0]} to {r[2]}, {r[1]} to {r[3]}), size=({w}x{h})")
