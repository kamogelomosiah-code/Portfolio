import { useState, useEffect } from 'react';

export const TimeOfDayWidget = () => {
    const [currentHour, setCurrentHour] = useState(new Date().getHours());

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentHour(new Date().getHours());
      }, 60000);
      return () => clearInterval(interval);
    }, []);
    
    let timeBlock = 'afternoon';
    if (currentHour >= 5 && currentHour < 12) timeBlock = 'morning';
    else if (currentHour >= 12 && currentHour < 17) timeBlock = 'afternoon';
    else if (currentHour >= 17 && currentHour < 20) timeBlock = 'evening';
    else timeBlock = 'night';
  
    const renderIllustration = () => {
      switch (timeBlock) {
        case 'morning':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="morningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#87CEEB" />
                  <stop offset="60%" stopColor="#FFDAB9" />
                  <stop offset="100%" stopColor="#FFF0C7" />
                </linearGradient>
              </defs>
              <rect width="400" height="160" fill="url(#morningSky)" />
              <circle cx="200" cy="100" r="45" fill="#FFC107" />
              <path d="M0,160 L0,120 Q50,90 100,120 Q150,150 200,120 Q250,90 300,120 Q350,150 400,120 L400,160 Z" fill="#81C784" opacity="0.9" />
              <path d="M-50,160 L-50,140 Q0,110 50,140 Q100,170 150,140 Q200,110 250,140 Q300,170 350,140 Q400,110 450,140 L450,160 Z" fill="#A5D6A7" opacity="0.6" />
            </svg>
          );
        case 'afternoon':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="afternoonSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4A90E2" />
                  <stop offset="100%" stopColor="#87CEFA" />
                </linearGradient>
              </defs>
              <rect width="400" height="160" fill="url(#afternoonSky)" />
              <circle cx="200" cy="50" r="35" fill="#FFFBEA" opacity="0.9" filter="drop-shadow(0 0 20px #FFFBEA)" />
              <path d="M50,60 Q70,40 90,60 Q110,50 120,70 Q130,90 100,90 L60,90 Q40,90 50,60" fill="#FFFFFF" opacity="0.8" />
              <path d="M250,80 Q270,60 290,80 Q310,70 320,90 Q330,110 300,110 L260,110 Q240,110 250,80" fill="#FFFFFF" opacity="0.7" />
              <path d="M0,160 L0,110 Q50,80 100,110 Q150,140 200,110 Q250,80 300,110 Q350,140 400,110 L400,160 Z" fill="#66BB6A" opacity="0.9" />
            </svg>
          );
        case 'evening':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="eveningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E5F" />
                  <stop offset="40%" stopColor="#FEB47B" />
                  <stop offset="100%" stopColor="#FFDAB9" />
                </linearGradient>
              </defs>
              <rect width="400" height="160" fill="url(#eveningSky)" />
              <circle cx="200" cy="110" r="45" fill="#FF8A65" />
              <path d="M0,160 L0,120 Q50,90 100,120 Q150,150 200,120 Q250,90 300,120 Q350,150 400,120 L400,160 Z" fill="#4E342E" opacity="0.8" />
              <path d="M-50,160 L-50,140 Q0,110 50,140 Q100,170 150,140 Q200,110 250,140 Q300,170 350,140 Q400,110 450,140 L450,160 Z" fill="#5D4037" opacity="0.6" />
            </svg>
          );
        case 'night':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="50%" stopColor="#1C2541" />
                  <stop offset="100%" stopColor="#3A506B" />
                </linearGradient>
              </defs>
              <rect width="400" height="160" fill="url(#nightSky)" />
              {/* Stars */}
              <circle cx="50" cy="40" r="1.5" fill="#FFFFFF" opacity="0.8" />
              <circle cx="80" cy="20" r="1" fill="#FFFFFF" opacity="0.6" />
              <circle cx="120" cy="60" r="2" fill="#FFFFFF" opacity="0.9" />
              <circle cx="280" cy="30" r="1.5" fill="#FFFFFF" opacity="0.7" />
              <circle cx="320" cy="70" r="1" fill="#FFFFFF" opacity="0.5" />
              <circle cx="370" cy="40" r="2" fill="#FFFFFF" opacity="0.8" />
              {/* Moon */}
              <path d="M220,50 A 25 25 0 1 1 180,30 A 30 30 0 0 0 220,50 Z" fill="#F6F1D5" />
              <path d="M0,160 L0,130 Q50,100 100,130 Q150,160 200,130 Q250,100 300,130 Q350,160 400,130 L400,160 Z" fill="#0C1B33" opacity="0.9" />
            </svg>
          );
      }
    };
  
    const greetings = {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night'
    };
  
    return (
      <div className="w-full mb-8 relative border border-[var(--border-light)] rounded-[24px] shadow-sm bg-[var(--bg-card)] overflow-hidden h-[160px]">
        <div className="absolute inset-0">
          {renderIllustration()}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
          <h2 className="text-white text-[24px] font-bold tracking-tight mb-1" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
            {greetings[timeBlock as keyof typeof greetings]}!
          </h2>
          <p className="text-white/90 text-[14px] font-medium" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            How can I help you today?
          </p>
        </div>
      </div>
    );
  };
