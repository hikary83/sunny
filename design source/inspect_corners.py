from PIL import Image

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_game_asset_sheet_for_a_swimming_themed_educational\screen.png")
img = img.convert("RGB")
width, height = img.size

print("Corners:")
print("Top-Left (0,0):", img.getpixel((0, 0)))
print("Top-Right (width-1, 0):", img.getpixel((width - 1, 0)))
print("Bottom-Left (0, height-1):", img.getpixel((0, height - 1)))
print("Bottom-Right (width-1, height-1):", img.getpixel((width - 1, height - 1)))

# Let's count some colors
from collections import Counter
colors = []
for y in range(0, height, 10):
    for x in range(0, width, 10):
        colors.append(img.getpixel((x, y)))
c = Counter(colors)
print("Most common colors:")
for color, count in c.most_common(10):
    print(f"Color: {color}, Count: {count}")
