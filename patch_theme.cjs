const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');

const additionalThemes = `
/* Morning Theme (Warm Orange/Yellow) */
.theme-morning {
  --md-sys-color-primary: #D97706;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #FEF3C7;
  --md-sys-color-on-primary-container: #78350F;
  --md-sys-color-inverse-primary: #FCD34D;
}
.dark.theme-morning {
  --md-sys-color-primary: #FBBF24;
  --md-sys-color-on-primary: #451A03;
  --md-sys-color-primary-container: #78350F;
  --md-sys-color-on-primary-container: #FEF3C7;
}

/* Afternoon Theme (Bright Blue) */
.theme-afternoon {
  --md-sys-color-primary: #0284C7;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #E0F2FE;
  --md-sys-color-on-primary-container: #0C4A6E;
  --md-sys-color-inverse-primary: #7DD3FC;
}
.dark.theme-afternoon {
  --md-sys-color-primary: #38BDF8;
  --md-sys-color-on-primary: #082F49;
  --md-sys-color-primary-container: #0C4A6E;
  --md-sys-color-on-primary-container: #E0F2FE;
}

/* Evening Theme (Sunset Orange/Red) */
.theme-evening {
  --md-sys-color-primary: #E11D48;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #FFE4E6;
  --md-sys-color-on-primary-container: #881337;
  --md-sys-color-inverse-primary: #FDA4AF;
}
.dark.theme-evening {
  --md-sys-color-primary: #FB7185;
  --md-sys-color-on-primary: #4C0519;
  --md-sys-color-primary-container: #881337;
  --md-sys-color-on-primary-container: #FFE4E6;
}

/* Night Theme (Indigo/Purple) */
.theme-night {
  --md-sys-color-primary: #7C3AED;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #EDE9FE;
  --md-sys-color-on-primary-container: #4C1D95;
  --md-sys-color-inverse-primary: #C4B5FD;
}
.dark.theme-night {
  --md-sys-color-primary: #A78BFA;
  --md-sys-color-on-primary: #2E1065;
  --md-sys-color-primary-container: #4C1D95;
  --md-sys-color-on-primary-container: #EDE9FE;
}
`;

if (!css.includes('.theme-morning')) {
  css = css.replace('.dark {', additionalThemes + '\n.dark {');
  fs.writeFileSync('src/index.css', css);
}

let app = fs.readFileSync('src/App.tsx', 'utf-8');

const newAppThemeEffect = `
  useEffect(() => {
    const updateTimeBasedTheme = () => {
      const currentHour = new Date().getHours();
      const root = document.documentElement;

      // Dark mode between 6 PM (18) and 7 AM (7)
      if (currentHour < 7 || currentHour >= 18) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Remove existing themes
      root.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-night');

      // Add appropriate theme
      if (currentHour >= 5 && currentHour < 12) {
        root.classList.add('theme-morning');
      } else if (currentHour >= 12 && currentHour < 17) {
        root.classList.add('theme-afternoon');
      } else if (currentHour >= 17 && currentHour < 20) {
        root.classList.add('theme-evening');
      } else {
        root.classList.add('theme-night');
      }
    };
    
    updateTimeBasedTheme();
    const interval = setInterval(updateTimeBasedTheme, 60000);
    return () => clearInterval(interval);
  }, []);
`;

// replace the old updateTimeBasedTheme effect
app = app.replace(/useEffect\(\(\) => \{\n\s*const updateTimeBasedTheme = \(\) => \{[\s\S]*?return \(\) => clearInterval\(interval\);\n\s*\}, \[\]\);/, newAppThemeEffect.trim());

// also remove accentColor and its effect
app = app.replace(/const \[accentColor, setAccentColor\] = useState\(getDefaultAccentColor\(\)\);\n/g, '');
app = app.replace(/useEffect\(\(\) => \{\n\s*document\.documentElement\.style\.setProperty\('--accent-color', accentColor\);\n\s*\}, \[accentColor\]\);\n/g, '');
app = app.replace(/const getDefaultAccentColor = \(\) => \{[\s\S]*?\};\n/g, '');

fs.writeFileSync('src/App.tsx', app);
