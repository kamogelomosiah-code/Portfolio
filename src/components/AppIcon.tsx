import React from "react";

export function AppIcon({ className = "w-6 h-6", color }: { className?: string, color?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
    >
      <path d="M10,10 L70,10 L90,30 L90,90 L10,90 Z" fill="var(--md-sys-color-surface-container-highest)" stroke="currentColor" strokeWidth="8" strokeLinejoin="round"/>
      <rect x="25" y="10" width="45" height="25" fill="var(--md-sys-color-surface-container-highest)" stroke="currentColor" strokeWidth="8" strokeLinejoin="round"/>
      <rect x="45" y="10" width="15" height="15" fill="currentColor"/>
      <path d="M18,55 L82,55 L82,90 L18,90 Z" fill="var(--md-sys-color-surface-container-highest)" stroke="currentColor" strokeWidth="8" strokeLinejoin="round"/>
      <rect x="22" y="59" width="56" height="10" fill="#FF0000"/>
      <rect x="30" y="75" width="8" height="6" rx="3" fill="currentColor"/>
      <rect x="45" y="75" width="25" height="6" rx="3" fill="currentColor"/>
    </svg>
  );
}
