import React from "react";

interface MaterialIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MaterialIcon({ name, className = "", style }: MaterialIconProps) {
  return (
    <span 
      className={`material-icons select-none ${className}`} 
      style={{ 
        fontSize: "inherit", 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center", 
        verticalAlign: "middle",
        lineHeight: "1",
        ...style 
      }}
    >
      {name}
    </span>
  );
}
