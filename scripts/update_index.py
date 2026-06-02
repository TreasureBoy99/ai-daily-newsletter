#!/usr/bin/env python3
"""Update index.json and latest.json based on files in data/ directory."""

import json
import os
import re
import shutil
from pathlib import Path

def main():
    data_dir = Path("data")
    if not data_dir.exists():
        data_dir.mkdir(parents=True, exist_ok=True)
        print("Created data directory.")

    # Find all daily news JSON files matching ai-news-YYYY-MM-DD.json
    pattern = re.compile(r"^ai-news-(\d{4}-\d{2}-\d{2})\.json$")
    dates = []
    
    for file in data_dir.glob("ai-news-*.json"):
        match = pattern.match(file.name)
        if match:
            dates.append(match.group(1))

    # Sort dates descending (newest first)
    dates.sort(reverse=True)
    print(f"Found daily files for dates: {dates}")

    # Write to index.json
    index_path = data_dir / "index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(dates, f, ensure_ascii=False, indent=2)
    print(f"Updated index.json at {index_path}")

    # Copy the latest file to latest.json
    if dates:
        newest_date = dates[0]
        newest_file = data_dir / f"ai-news-{newest_date}.json"
        latest_file = data_dir / "latest.json"
        shutil.copy(newest_file, latest_file)
        print(f"Copied {newest_file.name} to latest.json")
    else:
        print("No daily files found to set latest.json")

if __name__ == "__main__":
    main()
