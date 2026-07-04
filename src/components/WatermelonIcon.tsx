import appIcon from "../assets/app_icon.png";

export function WatermelonIcon({ className = "w-6 h-6" }: { className?: string, color?: string }) {
  return (
    <img 
      src={appIcon} 
      alt="Kamo AI Logo" 
      className={`${className} rounded-full object-cover shadow-sm`}
      referrerPolicy="no-referrer"
    />
  );
}
