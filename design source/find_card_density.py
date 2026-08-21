from PIL import Image

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_game_asset_sheet_for_a_swimming_themed_educational\screen.png")
img = img.convert("RGB")
width, height = img.size

# Count white pixels (R,G,B > 240) in each row
row_counts = []
for y in range(height):
    count = 0
    for x in range(width):
        r, g, b = img.getpixel((x, y))
        if r > 240 and g > 240 and b > 240:
            count += 1
    row_counts.append(count)

# Count white pixels in each column
col_counts = []
for x in range(width):
    count = 0
    for y in range(height):
        r, g, b = img.getpixel((x, y))
        if r > 240 and g > 240 and b > 240:
            count += 1
    col_counts.append(count)

# Find rows where white count is significant (e.g., > 30% of width)
active_rows = [y for y, c in enumerate(row_counts) if c > width * 0.3]
# Find columns where white count is significant (e.g., > 30% of height)
active_cols = [x for x, c in enumerate(col_counts) if c > height * 0.3]

if active_rows and active_cols:
    min_y, max_y = min(active_rows), max(active_rows)
    min_x, max_x = min(active_cols), max(active_cols)
    print(f"Detected card box: x={min_x} to {max_x}, y={min_y} to {max_y}")
    print(f"Card size: {max_x - min_x} x {max_y - min_y}")
else:
    print("Could not detect card box with density method.")
