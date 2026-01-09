#!/bin/bash

# Script to convert all "bit/bits" display text to "beat/beats" in frontend
# This focuses on user-visible text, not variable names

echo "🔄 Converting bit/bits to beat/beats in frontend display text..."

cd "$(dirname "$0")"

# Find all TypeScript/TSX files in frontend
find ./apps/frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
  # Create backup
  cp "$file" "$file.bak"
  
  # Convert display text variations
  sed -i \
    -e 's/\bBIT\b/BEAT/g' \
    -e 's/\bBITS\b/BEATS/g' \
    -e 's/\bbits\b/beats/g' \
    -e 's/\bBits\b/Beats/g' \
    -e 's/\bbit\b/beat/g' \
    -e 's/\bBit\b/Beat/g' \
    -e 's/"bit"/"beat"/g' \
    -e "s/'bit'/'beat'/g" \
    -e 's/"bits"/"beats"/g' \
    -e "s/'bits'/'beats'/g" \
    -e 's/>bit</>beat</g' \
    -e 's/>bits</>beats</g' \
    -e 's/>Bit</>Beat</g' \
    -e 's/>Bits</>Beats</g' \
    -e 's/placeholder="[^"]*bit[^"]*"/placeholder="$(echo "$BASH_REMATCH" | sed "s\/bit\/beat\/g; s\/Bit\/Beat\/g; s\/BIT\/BEAT\/g")"/g' \
    "$file"
  
  # Remove backup if file changed
  if ! cmp -s "$file" "$file.bak"; then
    echo "✓ Updated: $file"
    rm "$file.bak"
  else
    rm "$file.bak"
  fi
done

echo "✅ Conversion complete!"
echo ""
echo "Note: This script converts display text only."
echo "Variable names and technical code remain unchanged for stability."
