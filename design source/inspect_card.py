from PIL import Image

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_game_asset_sheet_for_a_swimming_themed_educational\screen.png")
img = img.convert("RGB")
width, height = img.size
print("Image size:", width, height)

# Find all pixels that are white (R,G,B > 250)
white_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b = img.getpixel((x, y))
        if r > 250 and g > 250 and b > 250:
            white_pixels.append((x, y))

if white_pixels:
    min_x = min(p[0] for p in white_pixels)
    max_x = max(p[0] for p in white_pixels)
    min_y = min(p[1] for p in white_pixels)
    max_y = max(p[1] for p in white_pixels)
    print(f"White card bounding box: ({min_x}, {min_y}) to ({max_x}, {max_y}), size: ({max_x - min_x}, {max_y - min_y})")
else:
    print("No white pixels found.")
