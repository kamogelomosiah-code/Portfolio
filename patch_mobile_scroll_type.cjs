const fs = require('fs');
let content = fs.readFileSync('src/components/MobileApp.tsx', 'utf-8');
content = content.replace(
  "const scrollToBottom = (behavior = 'smooth') => {",
  "const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {"
);
fs.writeFileSync('src/components/MobileApp.tsx', content);
