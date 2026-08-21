from PIL import Image

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming\screen.png")
img = img.convert("RGB")
width, height = img.size

# Let's downscale to 40x40 and print '#' for non-white, '.' for white
downscaled = img.resize((40, 40), Image.Resampling.LANCZOS)
for y in range(40):
    row = ""
    for x in range(40):
        r, g, b = downscaled.getpixel((x, y))
        # If not white
        if r < 240 or g < 240 or b < 240:
            row += "#"
        else:
            row += "."
    print(row)
