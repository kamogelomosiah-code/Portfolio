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
            <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="morningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1A1C4B" />
                  <stop offset="30%" stopColor="#3F2B96" />
                  <stop offset="60%" stopColor="#A83279" />
                  <stop offset="85%" stopColor="#D38312" />
                  <stop offset="100%" stopColor="#F8CDDA" />
                </linearGradient>
                <radialGradient id="morningSunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF9C4" stopOpacity="1" />
                  <stop offset="30%" stopColor="#FFE082" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#FFB300" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FFB300" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mountMorning3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6A1B9A" />
                  <stop offset="100%" stopColor="#AB47BC" />
                </linearGradient>
                <linearGradient id="waterMorning" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A83279" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#D38312" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3F2B96" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <rect width="400" height="160" fill="url(#morningSky)" />

              <g opacity="0.6">
                <circle cx="50" cy="25" r="1" fill="#FFF" />
                <circle cx="120" cy="15" r="1" fill="#FFF" />
                <circle cx="280" cy="30" r="1" fill="#FFF" />
                <circle cx="340" cy="20" r="1.5" fill="#FFF" opacity="0.8" />
              </g>

              <circle cx="200" cy="115" r="45" fill="url(#morningSunGlow)" />
              <circle cx="200" cy="115" r="16" fill="#FFFDE7" />

              <path d="M 60 120 L 140 60 L 220 120 Z" fill="url(#mountMorning3)" opacity="0.7" />
              <path d="M 180 120 L 270 50 L 360 120 Z" fill="url(#mountMorning3)" opacity="0.6" />

              <g>
                <path d="M 10 120 L 100 40 L 100 120 Z" fill="#5E35B1" />
                <path d="M 100 40 L 190 120 L 100 120 Z" fill="#7E57C2" />
              </g>
              <g>
                <path d="M 170 120 L 250 45 L 250 120 Z" fill="#4A148C" />
                <path d="M 250 45 L 330 120 L 250 120 Z" fill="#8E24AA" />
              </g>
              
              <path d="M -20 120 Q 100 100 200 120 Q 300 100 420 120 L 420 160 L -20 160 Z" fill="#2E1C4E" />

              <rect x="0" y="120" width="400" height="40" fill="url(#waterMorning)" />
              
              <g opacity="0.4">
                <ellipse cx="200" cy="130" rx="30" ry="1.5" fill="#FFFDE7" />
                <ellipse cx="180" cy="138" rx="55" ry="2" fill="#FFE082" />
                <ellipse cx="220" cy="145" rx="40" ry="1" fill="#FF8A65" />
                <ellipse cx="160" cy="150" rx="20" ry="1" fill="#FFFDE7" />
                <ellipse cx="240" cy="152" rx="15" ry="0.8" fill="#FFE082" />
              </g>

              <g fill="#1A0F30">
                <path d="M 15 130 L 20 115 L 25 130 Z" />
                <path d="M 12 135 L 20 110 L 28 135 Z" />
                <path d="M 5 140 L 12 122 L 19 140 Z" />
                
                <path d="M 375 135 L 380 118 L 385 135 Z" />
                <path d="M 365 142 L 372 120 L 379 142 Z" />
                <path d="M 382 132 L 387 112 L 392 132 Z" />
              </g>

              <g fill="#FFE082" opacity="0.6">
                <path d="M 50 50 Q 55 45 60 50 Q 65 45 70 50 Q 65 52 60 48 Q 55 52 50 50 Z" transform="translate(10, -10) scale(0.6)" />
                <path d="M 50 50 Q 55 45 60 50 Q 65 45 70 50 Q 65 52 60 48 Q 55 52 50 50 Z" transform="translate(100, 10) scale(0.4)" />
              </g>
            </svg>
          );
        case 'afternoon':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="afternoonSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1565C0" />
                  <stop offset="50%" stopColor="#1E88E5" />
                  <stop offset="100%" stopColor="#90CAF9" />
                </linearGradient>
                <radialGradient id="sunRays" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="0.4" />
                  <stop offset="25%" stopColor="#FFF" stopOpacity="0.2" />
                  <stop offset="60%" stopColor="#FFF" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="hillAfternoon1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00796B" />
                  <stop offset="100%" stopColor="#004D40" />
                </linearGradient>
                <linearGradient id="hillAfternoon2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2E7D32" />
                  <stop offset="100%" stopColor="#1B5E20" />
                </linearGradient>
                <linearGradient id="hillAfternoon3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#2E7D32" />
                </linearGradient>
              </defs>

              <rect width="400" height="160" fill="url(#afternoonSky)" />

              <circle cx="80" cy="50" r="120" fill="url(#sunRays)" />
              <circle cx="80" cy="50" r="18" fill="#FFFFFF" />
              
              <g opacity="0.75" transform="translate(10, 20) scale(0.8)">
                <path d="M 120 40 Q 140 20 160 35 Q 180 20 200 40 Q 215 45 210 60 L 110 60 Q 105 45 120 40 Z" fill="#FFFFFF" />
              </g>

              <path d="M 150 110 L 220 60 L 290 110 Z" fill="#006064" opacity="0.4" />
              <path d="M 230 110 L 310 50 L 390 110 Z" fill="#006064" opacity="0.3" />

              <path d="M -20 125 Q 70 85 170 115 Q 270 145 420 110 L 420 160 L -20 160 Z" fill="url(#hillAfternoon1)" />
              <path d="M -10 160 L -10 130 Q 110 100 220 135 Q 310 160 410 125 L 410 160 Z" fill="url(#hillAfternoon2)" opacity="0.9" />

              <g opacity="0.9" transform="translate(180, 15) scale(0.9)">
                <path d="M 120 40 Q 140 20 160 30 Q 180 15 200 30 Q 220 20 235 40 Q 245 55 230 65 L 100 65 Q 90 55 120 40 Z" fill="#FFFFFF" />
              </g>

              <path d="M 170 115 Q 200 125 210 135 Q 220 145 205 160 L 165 160 Q 180 145 175 135 Q 170 125 170 115 Z" fill="#29B6F6" opacity="0.8" />
              <path d="M 180 123 Q 195 130 200 136 Q 205 142 195 155" stroke="#E1F5FE" strokeWidth="1" fill="none" opacity="0.6" />

              <path d="M -10 145 Q 80 130 150 160 L -10 160 Z" fill="url(#hillAfternoon3)" />
              <path d="M 250 160 Q 320 135 410 145 L 410 160 Z" fill="url(#hillAfternoon3)" />

              <g fill="#1B5E20">
                <circle cx="15" cy="148" r="4" />
                <circle cx="22" cy="149" r="3" />
                <circle cx="35" cy="146" r="5" />
                <path d="M 30 147 L 32 135 L 34 147 Z" />
                <path d="M 120 155 L 125 142 L 130 155 Z" />
                <path d="M 126 157 L 129 146 L 133 157 Z" />
              </g>
              <g fill="#FFD54F">
                <circle cx="125" cy="142" r="1.5" />
                <circle cx="32" cy="135" r="1.5" />
              </g>
              <g fill="#E91E63">
                <circle cx="20" cy="146" r="1.5" />
                <circle cx="37" cy="143" r="1.5" />
              </g>
            </svg>
          );
        case 'evening':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="eveningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#311B92" />
                  <stop offset="30%" stopColor="#880E4F" />
                  <stop offset="60%" stopColor="#D81B60" />
                  <stop offset="85%" stopColor="#FF5722" />
                  <stop offset="100%" stopColor="#FFC107" />
                </linearGradient>
                <radialGradient id="eveningSunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
                  <stop offset="40%" stopColor="#FFE082" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#FF7043" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FF7043" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="waterEvening" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF5722" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#D81B60" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#311B92" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <rect width="400" height="160" fill="url(#eveningSky)" />

              <circle cx="230" cy="115" r="40" fill="url(#eveningSunGlow)" />
              <circle cx="230" cy="115" r="15" fill="#FFF8E1" />

              <g opacity="0.4" transform="translate(40, 25) scale(0.7)">
                <path d="M 120 40 Q 140 20 160 30 Q 180 15 200 30 Q 220 20 235 40 L 100 40 Z" fill="#FFE082" />
              </g>

              <g opacity="0.6">
                <path d="M 20 120 L 90 55 L 90 120 Z" fill="#4A148C" />
                <path d="M 90 55 L 160 120 L 90 120 Z" fill="#6A1B9A" />
              </g>
              <g opacity="0.5">
                <path d="M 280 120 L 340 65 L 340 120 Z" fill="#311B92" />
                <path d="M 340 65 L 400 120 L 340 120 Z" fill="#512DA8" />
              </g>

              <g>
                <path d="M 110 120 L 200 35 L 200 120 Z" fill="#2E0854" />
                <path d="M 200 35 L 290 120 L 200 120 Z" fill="#6C2D91" />
              </g>

              <path d="M -20 120 Q 100 105 200 120 Q 300 105 420 120 L 420 160 L -20 160 Z" fill="#1A0933" />

              <rect x="0" y="120" width="400" height="40" fill="url(#waterEvening)" />

              <g opacity="0.5">
                <ellipse cx="230" cy="128" rx="25" ry="1" fill="#FFF8E1" />
                <ellipse cx="220" cy="135" rx="45" ry="1.5" fill="#FFE082" />
                <ellipse cx="245" cy="142" rx="30" ry="1" fill="#FF7043" />
                <ellipse cx="205" cy="148" rx="15" ry="0.8" fill="#FFF8E1" />
              </g>

              <g fill="#0F0324">
                <path d="M 15 132 L 21 112 L 27 132 Z" />
                <path d="M 23 138 L 28 118 L 33 138 Z" />
                <path d="M 7 140 L 13 120 L 19 140 Z" />
                
                <path d="M 370 135 L 375 115 L 380 135 Z" />
                <path d="M 380 141 L 385 119 L 390 141 Z" />
              </g>

              <g fill="#FF7043" opacity="0.6">
                <path d="M 120 40 Q 123 37 126 40 Q 129 37 132 40 Q 129 41 126 39 Q 123 41 120 40 Z" transform="translate(-40, -10)" />
                <path d="M 120 40 Q 123 37 126 40 Q 129 37 132 40 Q 129 41 126 39 Q 123 41 120 40 Z" transform="translate(-10, -20) scale(0.8)" />
              </g>
            </svg>
          );
        case 'night':
          return (
            <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full rounded-[24px]">
              <defs>
                <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#040209" />
                  <stop offset="40%" stopColor="#0C0721" />
                  <stop offset="80%" stopColor="#1B0F3A" />
                  <stop offset="100%" stopColor="#2E114D" />
                </linearGradient>
                <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFDE7" stopOpacity="1" />
                  <stop offset="30%" stopColor="#FFF9C4" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#FFF9C4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#FFF9C4" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="starHalo1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
                  <stop offset="10%" stopColor="#FFF" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#818CF8" stopOpacity="0.3" />
                  <stop offset="70%" stopColor="#818CF8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="starHalo2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
                  <stop offset="15%" stopColor="#FF80DF" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#FF80DF" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF80DF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mountNightLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E0A3B" />
                  <stop offset="100%" stopColor="#3C1A6B" />
                </linearGradient>
                <linearGradient id="mountNightRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5B258F" />
                  <stop offset="100%" stopColor="#8B36B8" />
                </linearGradient>
                <linearGradient id="waterNight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1B0F3A" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#2E114D" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0C0721" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="shootingStarTail" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="30%" stopColor="#C084FC" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                </linearGradient>
              </defs>

              <rect width="400" height="160" fill="url(#nightSky)" />

              <ellipse cx="280" cy="50" rx="90" ry="40" fill="#C084FC" filter="blur(30px)" opacity="0.12" />
              <ellipse cx="100" cy="30" rx="70" ry="30" fill="#3B82F6" filter="blur(25px)" opacity="0.1" />

              <circle cx="280" cy="35" r="14" fill="url(#starHalo1)" />
              <circle cx="280" cy="35" r="1.5" fill="#FFFFFF" />
              
              <circle cx="80" cy="25" r="10" fill="url(#starHalo2)" />
              <circle cx="80" cy="25" r="1" fill="#FFFFFF" />

              <circle cx="150" cy="45" r="8" fill="url(#starHalo1)" opacity="0.7" />
              <circle cx="150" cy="45" r="1" fill="#FFFFFF" />

              <circle cx="40" cy="60" r="0.8" fill="#FFF" opacity="0.5" />
              <circle cx="120" cy="15" r="1" fill="#FFF" opacity="0.8" />
              <circle cx="210" cy="25" r="1" fill="#FFF" opacity="0.6" />
              <circle cx="320" cy="55" r="0.8" fill="#FFF" opacity="0.5" />
              <circle cx="350" cy="20" r="1.2" fill="#FFF" opacity="0.9" />

              <line x1="220" y1="10" x2="160" y2="45" stroke="url(#shootingStarTail)" strokeWidth="1.8" strokeLinecap="round" />
              
              <circle cx="325" cy="30" r="22" fill="url(#moonGlow)" />
              <path d="M 333 18 A 12 12 0 1 0 321 34 A 10 10 0 1 1 333 18 Z" fill="#FFFDE7" />

              <g opacity="0.5">
                <path d="M 40 120 L 110 50 L 110 120 Z" fill="#1F0D3D" />
                <path d="M 110 50 L 180 120 L 110 120 Z" fill="#35185E" />
              </g>
              <g opacity="0.4">
                <path d="M 240 120 L 300 65 L 300 120 Z" fill="#180B30" />
                <path d="M 300 65 L 360 120 L 300 120 Z" fill="#2E1454" />
              </g>

              <g>
                <path d="M 120 120 L 210 30 L 210 120 Z" fill="url(#mountNightLeft)" />
                <path d="M 210 30 L 300 120 L 210 120 Z" fill="url(#mountNightRight)" />
                <path d="M 210 30 L 213 35 L 210 40 L 214 55 L 210 70 L 213 90 L 210 120" stroke="#E879F9" strokeWidth="1" fill="none" opacity="0.4" />
              </g>

              <path d="M -20 120 Q 100 108 200 120 Q 300 108 420 120 L 420 160 L -20 160 Z" fill="#0A0414" />

              <rect x="0" y="120" width="400" height="40" fill="url(#waterNight)" />

              <g opacity="0.4">
                <ellipse cx="325" cy="132" rx="12" ry="1" fill="#FFFDE7" />
                <ellipse cx="320" cy="140" rx="8" ry="0.8" fill="#FFFDE7" />
                <ellipse cx="280" cy="128" rx="15" ry="0.6" fill="#818CF8" />
                <ellipse cx="210" cy="134" rx="35" ry="1.2" fill="#C084FC" />
                <ellipse cx="230" cy="144" rx="20" ry="0.8" fill="#818CF8" />
                <ellipse cx="80" cy="130" rx="12" ry="0.5" fill="#FF80DF" />
                <ellipse cx="150" cy="138" rx="10" ry="0.8" fill="#818CF8" />
              </g>

              <g fill="#05010A">
                <path d="M 15 132 L 20 115 L 25 132 Z" />
                <path d="M 22 138 L 27 120 L 32 138 Z" />
                <path d="M 8 141 L 13 124 L 18 141 Z" />
                
                <path d="M 375 134 L 380 116 L 385 134 Z" />
                <path d="M 367 142 L 373 122 L 379 142 Z" />
              </g>
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
