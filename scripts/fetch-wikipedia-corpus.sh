#!/bin/bash
# Fetch random Wikipedia article summaries for the creative lens corpus.
# Run locally (not in the cloud environment where Wikipedia is blocked).
# Leaves 3 seconds between requests to be polite.

set -e

CORPUS_DIR="$(dirname "$0")/../.shoe-makers/creative-corpus"
mkdir -p "$CORPUS_DIR"

COUNT=20
FETCHED=0

echo "Fetching $COUNT random Wikipedia articles..."

while [ $FETCHED -lt $COUNT ]; do
  # Get a random article title
  RANDOM_JSON=$(curl -s -H "User-Agent: Shoemakers/1.0 (https://github.com/maxthelion/shoe-makers)" \
    "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json")

  TITLE=$(echo "$RANDOM_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['query']['random'][0]['title'])" 2>/dev/null)

  if [ -z "$TITLE" ]; then
    echo "  Failed to get random title, retrying..."
    sleep 3
    continue
  fi

  # Get the article extract
  ENCODED_TITLE=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TITLE'))")
  EXTRACT_JSON=$(curl -s -H "User-Agent: Shoemakers/1.0 (https://github.com/maxthelion/shoe-makers)" \
    "https://en.wikipedia.org/w/api.php?action=query&titles=${ENCODED_TITLE}&prop=extracts&exintro=true&explaintext=true&format=json")

  SUMMARY=$(echo "$EXTRACT_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
pages = data['query']['pages']
page = list(pages.values())[0]
extract = page.get('extract', '').strip()
# Truncate to 500 chars to minimise token usage
print(extract[:500])
" 2>/dev/null)

  # Skip stubs
  if [ ${#SUMMARY} -lt 50 ]; then
    echo "  Skipping stub: $TITLE"
    sleep 3
    continue
  fi

  FETCHED=$((FETCHED + 1))

  # Write as markdown
  SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | head -c 60)
  FILENAME="${SLUG}.md"

  cat > "$CORPUS_DIR/$FILENAME" << ARTICLE
---
title: "$TITLE"
source: https://en.wikipedia.org/wiki/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TITLE'))")
fetched: $(date -u +%Y-%m-%dT%H:%M:%SZ)
---

$SUMMARY
ARTICLE

  echo "  [$FETCHED/$COUNT] $TITLE"

  if [ $FETCHED -lt $COUNT ]; then
    sleep 3
  fi
done

echo "Done. $FETCHED articles written to $CORPUS_DIR/"
