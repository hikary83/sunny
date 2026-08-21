import os

def build_gas_single_file():
    project_dir = r"d:\Codex\sunny"
    
    html_path = os.path.join(project_dir, "index.html")
    css_path = os.path.join(project_dir, "style.css")
    js_path = os.path.join(project_dir, "game.js")
    
    if not (os.path.exists(html_path) and os.path.exists(css_path) and os.path.exists(js_path)):
        print("Error: index.html, style.css, or game.js is missing.")
        return
        
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
        
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()
        
    # Replace local asset paths in JS with the raw GitHub URLs
    github_assets_url = "https://raw.githubusercontent.com/hikary83/sunny/main/assets/"
    # Replace assets/ globally to handle single quotes, double quotes, and backticks
    js_content = js_content.replace("assets/", github_assets_url)
    
    # Also replace local asset paths in HTML img tags
    html_content = html_content.replace('src="assets/', f'src="{github_assets_url}')
    
    # Replace link rel="stylesheet"
    css_tag = f"<style>\n{css_content}\n</style>"
    html_content = html_content.replace('<link rel="stylesheet" href="style.css">', css_tag)
    
    # Replace script src="game.js"
    js_tag = f"<script>\n{js_content}\n</script>"
    html_content = html_content.replace('<script src="game.js"></script>', js_tag)
    
    # Save the output file
    out_path = os.path.join(project_dir, "gas_deploy.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Success! Merged file saved to: {out_path}")
    print("You can copy the entire content of this file and paste it into Index.html in Google Apps Script.")

if __name__ == "__main__":
    build_gas_single_file()
