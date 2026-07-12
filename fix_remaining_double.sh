#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  sed -i 's/bg-surface bg-surface-container-highest/bg-surface-container-highest/g' "$file"
  sed -i 's/hover:bg-surface-container hover:bg-surface-container-highest/hover:bg-surface-container-highest/g' "$file"
  sed -i 's/bg-inverse-surface hover:bg-surface-container-highest bg-surface-container-highest hover:bg-surface-variant/bg-inverse-surface hover:bg-surface-container-highest/g' "$file"
  sed -i 's/bg-surface hover:bg-surface-container dark:bg-transparent hover:bg-surface-container-highest\/80/bg-surface hover:bg-surface-container-highest/g' "$file"
  sed -i 's/border-outline-variant\/60 border-outline\/60/border-outline-variant/g' "$file"
  sed -i 's/hover:border-gray-400  hover:bg-surface-container-highest/hover:bg-surface-container-highest/g' "$file"
  sed -i 's/bg-surface-container-low\/30/bg-surface-container-low/g' "$file"
  sed -i 's/border-neutral-100 border-outline\/60/border-outline-variant/g' "$file"
  sed -i 's/border border-gray-100 border-outline/border border-outline/g' "$file"
  sed -i 's/dark:hover:border-outline//g' "$file"
  sed -i 's/dark:hover:bg-surface-variant//g' "$file"
  sed -i 's/text-neutral-300 text-on-surface-variant/text-on-surface-variant/g' "$file"
done
