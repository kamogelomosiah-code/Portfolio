import React from "react";
import { Brain } from "lucide-react";

export function AppIcon({ className = "w-6 h-6", color }: { className?: string, color?: string }) {
  return (
    <Brain className={className} style={{ color }} strokeWidth={2} />
  );
}

