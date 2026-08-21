from PIL import Image
from collections import Counter

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming\screen.png")
img = img.convert("RGB")
width, height = img.size

# Let's count some colors in the region x=90..934, y=120..910
colors = []
for y in range(120, 910, 5):
    for x in range(90, 934, 5):
        colors.append(img.getpixel((x, y)))
c = Counter(colors)
print("Dominant colors in the card region:")
for color, count in c.most_common(15):
    print(f"Color: {color}, Count: {count}")
