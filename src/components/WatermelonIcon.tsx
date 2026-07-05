import { MaterialIcon } from "./MaterialIcon";

export function WatermelonIcon({ className = "w-6 h-6", color }: { className?: string, color?: string }) {
  // Parse standard Tailwind width/height classes to translate to proper MaterialIcon font-sizes
  let fontSize = "24px";
  if (className.includes("w-4 ")) {
    fontSize = "16px";
  } else if (className.includes("w-4.5")) {
    fontSize = "18px";
  } else if (className.includes("w-5")) {
    fontSize = "20px";
  } else if (className.includes("w-6")) {
    fontSize = "24px";
  } else if (className.includes("w-8")) {
    fontSize = "32px";
  } else if (className.includes("w-10")) {
    fontSize = "40px";
  }

  return (
    <MaterialIcon 
      name="psychology" 
      className={className} 
      style={{ fontSize, color }}
    />
  );
}

