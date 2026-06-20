export function WatermelonIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className}
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 5c0 8.837-7.163 16-16 16-.48 0-.952-.02-1.417-.061" stroke="var(--color-accent)" />
      <path d="M18.8 8.2c0 6.628-5.372 12-12 12-.36 0-.714-.015-1.063-.046" stroke="#000" opacity="0.1" strokeWidth="1" />
      <path d="M20 6c0 8.837-7.163 16-16 16 0 0-3-10 6-18 4-3.5 10-2 10-2z" fill="#D93025" stroke="none" />
      
      <path d="M21 5c0 8.837-7.163 16-16 16-.388 0-.769-.013-1.144-.04" stroke="var(--color-accent)" strokeWidth="2"/>
      <path d="M5 21c-2.348-2.617-3-6.522-3-10 0-4.418 3.582-8 8-8 2.65 0 5.485 1.135 7.42 2.636" stroke="var(--color-accent)" strokeWidth="2"/>
      <circle cx="11" cy="11" r="1" fill="#000" stroke="none" />
      <circle cx="14" cy="9" r="1" fill="#000" stroke="none" />
      <circle cx="8" cy="14" r="1" fill="#000" stroke="none" />
      <circle cx="14" cy="13" r="1" fill="#000" stroke="none" />
      <circle cx="10" cy="16" r="1" fill="#000" stroke="none" />
    </svg>
  );
}
