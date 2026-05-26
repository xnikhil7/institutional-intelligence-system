from pathlib import Path
import re

paths = list(Path('client').glob('**/*.js')) + list(Path('client').glob('*.html'))
changed = 0
for path in paths:
    text = path.read_text(encoding='utf-8')
    orig = text
    # Fix broken API expression quoted as string
    text = re.sub(r'("|\')API \+ "', 'API + "', text)
    text = re.sub(r'("|\')API \+ \'', 'API + \'', text)
    # Fix broken direct `API +` string that appears inside quotes
    text = re.sub(r'"API \+ "', 'API + "', text)
    text = re.sub(r'"API \+ \'', 'API + \'', text)
    # Fix api fallback in api.js
    if path.name == 'api.js':
        text = re.sub(
            r'const API = window\.API \|\| \(window\.location\.hostname === "localhost"\s*\?\s*"[^"]*"\s*:\s*"[^"]*"\);',
            'const API = window.API || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : "https://iis-backend.onrender.com/api");',
            text
        )
    if text != orig:
        path.write_text(text, encoding='utf-8')
        print('Fixed', path)
        changed += 1
print('Files changed:', changed)
