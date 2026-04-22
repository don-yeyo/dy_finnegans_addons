import json
import os

filepath = r'C:\Users\gabrielt\.gemini\antigravity\brain\7fe650f9-9126-4f6a-a12d-041a9b0f2750\.system_generated\steps\359\content.md'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    json_str = "".join(lines[4:])
    data = json.loads(json_str)

print("--- Paths containing 'ENVI' ---")
for p in data['paths'].keys():
    if 'ENVI' in p.upper():
        print(p)
