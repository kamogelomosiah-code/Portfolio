#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  # Replace old legacy CSS variables
  sed -i 's/bg-\[var(--bg-main)\]/bg-background/g' "$file"
  sed -i 's/bg-\[var(--bg-card)\]/bg-surface/g' "$file"
  sed -i 's/bg-\[var(--bg-elevated)\]/bg-surface-container/g' "$file"
  
  sed -i 's/text-\[var(--text-main)\]/text-on-background/g' "$file"
  sed -i 's/text-\[var(--text-muted)\]/text-on-surface-variant/g' "$file"
  
  sed -i 's/border-\[var(--border-light)\]/border-outline-variant/g' "$file"
  sed -i 's/border-\[var(--border-subtle)\]/border-outline-variant/g' "$file"
  
  sed -i 's/bg-\[var(--color-accent)\]/bg-primary/g' "$file"
  sed -i 's/text-\[var(--color-accent)\]/text-primary/g' "$file"
  sed -i 's/border-\[var(--color-accent)\]/border-primary/g' "$file"
  
  sed -i 's/bg-\[var(--color-accent-light)\]/bg-primary-container/g' "$file"
  sed -i 's/text-\[var(--color-accent-light)\]/text-on-primary-container/g' "$file"

  # Replace hardcoded tailwind neutral/gray with semantic colors
  # Backgrounds
  sed -i 's/bg-neutral-50/bg-surface-container-low/g' "$file"
  sed -i 's/bg-neutral-100/bg-surface-container/g' "$file"
  sed -i 's/bg-neutral-200/bg-surface-container-high/g' "$file"
  sed -i 's/bg-neutral-800/bg-surface-container-highest/g' "$file"
  sed -i 's/bg-neutral-900/bg-inverse-surface/g' "$file"
  
  sed -i 's/bg-gray-50/bg-surface-container-low/g' "$file"
  sed -i 's/bg-gray-100/bg-surface-container/g' "$file"
  sed -i 's/bg-gray-200/bg-surface-container-high/g' "$file"
  sed -i 's/bg-gray-800/bg-surface-container-highest/g' "$file"
  sed -i 's/bg-gray-900/bg-inverse-surface/g' "$file"

  # Text colors
  sed -i 's/text-neutral-500/text-on-surface-variant/g' "$file"
  sed -i 's/text-neutral-400/text-on-surface-variant/g' "$file"
  sed -i 's/text-neutral-600/text-on-surface-variant/g' "$file"
  sed -i 's/text-neutral-700/text-on-surface/g' "$file"
  sed -i 's/text-neutral-800/text-on-surface/g' "$file"
  sed -i 's/text-neutral-900/text-on-surface/g' "$file"
  
  sed -i 's/text-gray-500/text-on-surface-variant/g' "$file"
  sed -i 's/text-gray-400/text-on-surface-variant/g' "$file"
  sed -i 's/text-gray-600/text-on-surface-variant/g' "$file"
  sed -i 's/text-gray-700/text-on-surface/g' "$file"
  sed -i 's/text-gray-800/text-on-surface/g' "$file"
  sed -i 's/text-gray-900/text-on-surface/g' "$file"

  # Borders
  sed -i 's/border-neutral-200/border-outline-variant/g' "$file"
  sed -i 's/border-neutral-300/border-outline-variant/g' "$file"
  sed -i 's/border-neutral-700/border-outline/g' "$file"
  sed -i 's/border-neutral-800/border-outline/g' "$file"
  
  sed -i 's/border-gray-200/border-outline-variant/g' "$file"
  sed -i 's/border-gray-300/border-outline-variant/g' "$file"
  sed -i 's/border-gray-700/border-outline/g' "$file"
  sed -i 's/border-gray-800/border-outline/g' "$file"

  # Hover background states
  sed -i 's/hover:bg-neutral-100/hover:bg-surface-container-high/g' "$file"
  sed -i 's/hover:bg-neutral-200/hover:bg-surface-container-highest/g' "$file"
  sed -i 's/hover:bg-neutral-700/hover:bg-surface-variant/g' "$file"
  sed -i 's/hover:bg-neutral-800/hover:bg-surface-container-highest/g' "$file"
  
  # Clean up duplicate dark: modifiers if any got weird (Tailwind v4 doesn't need dark: everywhere for semantic variables but the old code has them).
  sed -i 's/dark:bg-inverse-surface/dark:bg-surface-container-highest/g' "$file"
  sed -i 's/dark:bg-surface-container-highest/bg-surface-container-highest/g' "$file"
  sed -i 's/dark:text-on-surface/text-on-surface/g' "$file"
  sed -i 's/dark:text-on-surface-variant/text-on-surface-variant/g' "$file"
  sed -i 's/dark:border-outline/border-outline/g' "$file"
  sed -i 's/dark:border-outline-variant/border-outline-variant/g' "$file"
  sed -i 's/dark:bg-surface-container-high/bg-surface-container-high/g' "$file"
  sed -i 's/dark:bg-surface-container/bg-surface-container/g' "$file"
  sed -i 's/dark:hover:bg-surface-container-highest/hover:bg-surface-container-highest/g' "$file"
  sed -i 's/dark:hover:bg-surface-variant/hover:bg-surface-variant/g' "$file"
  
  # Fix corner cases with transparency
  sed -i 's/bg-surface-container-low\/50/bg-surface-container-low/g' "$file"
  sed -i 's/bg-surface-container\/50/bg-surface-container/g' "$file"
  sed -i 's/border-outline-variant\/50/border-outline-variant/g' "$file"
  sed -i 's/border-outline-variant\/30/border-outline-variant/g' "$file"
  sed -i 's/border-outline\/50/border-outline/g' "$file"

  # More specific cleanup for any double classes resulting from replacing `bg-neutral-100 dark:bg-neutral-800`
  sed -i 's/bg-surface-container bg-surface-container-highest/bg-surface-container/g' "$file"
  sed -i 's/text-on-surface-variant text-on-surface-variant/text-on-surface-variant/g' "$file"
  sed -i 's/text-on-surface text-on-surface/text-on-surface/g' "$file"
  sed -i 's/border-outline-variant border-outline/border-outline-variant/g' "$file"
  
  # Remove remaining dark: since we use semantic colors
  sed -i 's/dark:text-white/text-on-background/g' "$file"
  sed -i 's/dark:text-black/text-on-background/g' "$file"
  sed -i 's/text-black/text-on-background/g' "$file"
  sed -i 's/text-white/text-on-primary/g' "$file" # Usually used on accent colored buttons
  
  sed -i 's/bg-white/bg-surface/g' "$file"
  sed -i 's/bg-black/bg-inverse-surface/g' "$file"
  sed -i 's/dark:bg-[#121212]/bg-background/g' "$file"
  sed -i 's/dark:bg-[#1a1a1a]/bg-surface/g' "$file"

  # Typography (MD3 uses specific sizes, Tailwind maps text-sm to 14px etc, but let's replace custom sizing)
  sed -i 's/text-\[11px\]/text-label-small/g' "$file"
  sed -i 's/text-\[12px\]/text-label-medium/g' "$file"
  sed -i 's/text-\[13px\]/text-body-small/g' "$file"
  sed -i 's/text-\[14px\]/text-body-medium/g' "$file"
  sed -i 's/text-\[15px\]/text-title-small/g' "$file"
  sed -i 's/text-\[16px\]/text-title-medium/g' "$file"
  sed -i 's/text-\[18px\]/text-title-large/g' "$file"
  sed -i 's/text-\[20px\]/text-headline-small/g' "$file"
  sed -i 's/text-\[22px\]/text-headline-medium/g' "$file"
  sed -i 's/text-\[24px\]/text-headline-large/g' "$file"
  sed -i 's/text-\[32px\]/text-display-small/g' "$file"
  sed -i 's/text-\[36px\]/text-display-medium/g' "$file"
  
  # Border radius refactor to MD3 specs
  sed -i 's/rounded-\[4px\]/rounded-xs/g' "$file"
  sed -i 's/rounded-\[8px\]/rounded-sm/g' "$file"
  sed -i 's/rounded-\[12px\]/rounded-md/g' "$file"
  sed -i 's/rounded-\[16px\]/rounded-lg/g' "$file"
  sed -i 's/rounded-2xl/rounded-xl/g' "$file"
  sed -i 's/rounded-3xl/rounded-xl/g' "$file"
done
