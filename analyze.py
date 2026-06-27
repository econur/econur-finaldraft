import re

def analyze():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # Extract all class names from HTML
    html_classes = set()
    for match in re.finditer(r'class="([^"]+)"', html):
        for cls in match.group(1).split():
            html_classes.add(cls)

    # Extract all IDs from HTML
    html_ids = set()
    for match in re.finditer(r'id="([^"]+)"', html):
        html_ids.add(match.group(1))

    # Parse CSS for selectors (simplified)
    # Remove comments
    css_no_comments = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    
    # Extract blocks
    blocks = re.findall(r'([^{]+)\{([^}]+)\}', css_no_comments)
    
    unused_classes = set()
    unused_ids = set()

    for selectors, styles in blocks:
        # Check media queries etc - if it starts with @, skip the @ rule part, but wait, my regex is dumb for nested {}
        pass

    # A better way is just to regex search for \.[a-zA-Z0-9_-]+ and #[a-zA-Z0-9_-]+ in CSS and check against html sets
    css_classes = set(re.findall(r'\.([a-zA-Z0-9_-]+)', css_no_comments))
    css_ids = set(re.findall(r'#([a-zA-Z0-9_-]+)', css_no_comments))

    print("Unused Classes:")
    for cls in css_classes:
        if cls not in html_classes and not cls.startswith('active') and not cls.startswith('hover') and not cls.startswith('focus'):
            print(f".{cls}")

    print("\nUnused IDs:")
    for id_ in css_ids:
        if id_ not in html_ids:
            print(f"#{id_}")

if __name__ == '__main__':
    analyze()
