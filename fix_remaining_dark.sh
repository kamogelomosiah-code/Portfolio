#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  sed -i 's/dark:hover:text-neutral-200//g' "$file"
  sed -i 's/dark:text-neutral-300//g' "$file"
  sed -i 's/dark:text-neutral-200//g' "$file"
  sed -i 's/dark:placeholder:text-on-surface-variant//g' "$file"
  sed -i 's/dark:hover:bg-surface\/5//g' "$file"
  sed -i 's/dark:text-\[#818CF8\]//g' "$file"
  sed -i 's/dark:hover:border-neutral-500//g' "$file"
  sed -i 's/dark:border-white\/10//g' "$file"
  sed -i 's/dark:bg-inverse-surface\/30//g' "$file"
  sed -i 's/dark:border-white\/5//g' "$file"
  sed -i 's/dark:bg-emerald-950\/40//g' "$file"
  sed -i 's/dark:bg-sky-950\/40//g' "$file"
  sed -i 's/dark:border-amber-900\/30//g' "$file"
  sed -i 's/dark:border-emerald-900\/30//g' "$file"
  sed -i 's/dark:border-sky-900\/30//g' "$file"
  sed -i 's/dark:bg-purple-950\/40//g' "$file"
  sed -i 's/dark:border-purple-900\/30//g' "$file"
  sed -i 's/dark:bg-rose-950\/40//g' "$file"
  sed -i 's/dark:border-rose-900\/30//g' "$file"
  sed -i 's/dark:hover:text-red-400//g' "$file"
  sed -i 's/dark:text-red-400//g' "$file"
  sed -i 's/dark:bg-surface//g' "$file"
  sed -i 's/dark:text-amber-400//g' "$file"
  sed -i 's/dark:text-neutral-100//g' "$file"
  sed -i 's/dark:text-rose-400//g' "$file"
  sed -i 's/dark:text-sky-400//g' "$file"
  sed -i 's/dark:text-amber-400//g' "$file"
  
  # Remove transparency from semantic backgrounds that caused issues
  sed -i 's/bg-surface-container-highest\/50/bg-surface-container-highest/g' "$file"
  sed -i 's/bg-surface-container-highest\/60/bg-surface-container-highest/g' "$file"
  sed -i 's/bg-surface-container-highest\/40/bg-surface-container-highest/g' "$file"
  
  # Replace duplicate classes that could cause rendering bugs
  sed -i 's/bg-surface-container-low bg-surface-container-highest/bg-surface-container-low/g' "$file"
  sed -i 's/hover:bg-surface-container-low hover:bg-surface-container-highest/hover:bg-surface-container-highest/g' "$file"
  
  # A few specific weird classes
  sed -i 's/bg-surfacember-950\/40/bg-amber-100/g' "$file"
  sed -i 's/text-on-primary text-on-background/text-on-primary/g' "$file"
done
