import re

def convert_template_string(match):
    template = match.group(1)
    
    # If the template string is multiline (like in innerHTML)
    # We can join lines with \n or just use multiline double-quoted string concat
    is_multiline = '\n' in template
    
    # Split the template string into literal parts and expression parts
    # Pattern to match ${...}
    parts = re.split(r'\$\{([^}]+)\}', template)
    
    out_parts = []
    for i, part in enumerate(parts):
        if i % 2 == 0:
            # Literal part
            if part:
                # Escape double quotes and newlines
                escaped = part.replace('"', '\\"').replace('\n', '\\n').replace('\r', '')
                out_parts.append(f'"{escaped}"')
        else:
            # Expression part
            out_parts.append(f'({part})')
            
    # Join with +
    if not out_parts:
        return '""'
    return ' + '.join(out_parts)

with open(r"d:\Codex\sunny\game.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find all backtick strings, matching across multiple lines (re.DOTALL)
# Make sure we don't match greedy across multiple independent backtick strings.
# We use `([^`]+)` to match non-backtick characters inside.
pattern = r'`([^`]+)`'
new_content = re.sub(pattern, convert_template_string, content)

with open(r"d:\Codex\sunny\game.js", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Backticks successfully removed and replaced with standard string concatenation!")
