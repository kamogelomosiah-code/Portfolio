const fs = require('fs');

let chat = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');
chat = chat.replace(/const \[showSettingsModal, setShowSettingsModal\] = useState\(false\);/, '');
chat = chat.replace(/<button[^>]+onClick={\(\) => setShowSettingsModal\(true\)}[^>]*>[\s\S]*?<\/button>/, '');
chat = chat.replace(/\{showSettingsModal && \([\s\S]*?\}\)[\s\S]*?<\/div>\n\s*\)\}/, '');
chat = chat.replace(/\{showSettingsModal && \([\s\S]*?\)\}/, '');

fs.writeFileSync('src/components/ChatInterface.tsx', chat);

let mobile = fs.readFileSync('src/components/MobileApp.tsx', 'utf8');
mobile = mobile.replace(/import \{ SettingsModal \} from '.\/SettingsModal';/, '');
mobile = mobile.replace(/const \[showSettingsModal, setShowSettingsModal\] = useState\(false\);/, '');
mobile = mobile.replace(/<button[^>]+onClick={\(\) => setShowSettingsModal\(true\)}[^>]*>[\s\S]*?<\/button>/, '');
mobile = mobile.replace(/<SettingsModal[\s\S]*?\/>/, '');

fs.writeFileSync('src/components/MobileApp.tsx', mobile);

console.log("Settings removed");
