import os
from PIL import Image

def print_dims(path, name):
    if os.path.exists(path):
        img = Image.open(path)
        print(f"{name}: size={img.size}, mode={img.mode}")
    else:
        print(f"{name}: file not found at {path}")

if __name__ == "__main__":
    base_dir = r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack"
    print_dims(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_blue_alien_hero", "screen.png"), "Stitch")
    print_dims(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_puppy_dog_in_a", "screen.png"), "Dog")
    print_dims(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_baby_green_dinosaur_in", "screen.png"), "Dino")
    print_dims(os.path.join(base_dir, "a_professional_3d_voxel_character_sprite_sheet_of_a_cute_penguin_in_a_swimming", "screen.png"), "Penguin")
