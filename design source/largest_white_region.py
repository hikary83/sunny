from PIL import Image
import collections

img = Image.open(r"d:\Codex\sunny\design source\stitch_swimming_master_asset_pack\stitch_swimming_master_asset_pack\a_professional_3d_voxel_game_asset_sheet_for_a_swimming_themed_educational\screen.png")
img = img.convert("RGB")
width, height = img.size

# We want to find contiguous regions of white pixels (R,G,B > 240)
visited = set()
largest_box = None
largest_size = 0

for y in range(0, height, 10):  # Step 10 to speed up search
    for x in range(0, width, 10):
        if (x, y) in visited:
            continue
        r, g, b = img.getpixel((x, y))
        if r > 240 and g > 240 and b > 240:
            # BFS to find the size and bounding box of this white region
            min_x, max_x = x, x
            min_y, max_y = y, y
            queue = collections.deque([(x, y)])
            visited.add((x, y))
            size = 0
            
            while queue:
                cx, cy = queue.popleft()
                size += 1
                if cx < min_x: min_x = cx
                if cx > max_x: max_x = cx
                if cy < min_y: min_y = cy
                if cy > max_y: max_y = cy
                
                # Check 4-neighbors with step of 10
                for dx, dy in [(-10, 0), (10, 0), (0, -10), (0, 10)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            nr, ng, nb = img.getpixel((nx, ny))
                            if nr > 240 and ng > 240 and nb > 240:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
            
            if size > largest_size:
                largest_size = size
                largest_box = (min_x, min_y, max_x, max_y)

print(f"Largest white region size: {largest_size} pixels (step 10), bounding box: {largest_box}")
