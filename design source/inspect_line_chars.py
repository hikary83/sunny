with open(r"d:\Codex\sunny\gas_deploy.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 531 is index 530 (0-indexed)
start = 525
end = 535

for i in range(start, end):
    line = lines[i]
    print(f"Line {i+1}: {repr(line)}")
