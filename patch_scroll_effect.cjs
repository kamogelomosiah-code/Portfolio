const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

const regex = /useEffect\(\(\) => \{\s*\/\/\s*Only auto scroll to bottom if user is sending a message or it's loading[\s\S]*?\}, \[messages, isLoading, input\]\);/m;

if (regex.test(content)) {
  content = content.replace(regex, `useEffect(() => {
    // Only scroll to bottom initially
    if (messages.length <= 1) {
      scrollToBottom('auto');
    }
  }, []);`);
  fs.writeFileSync('src/components/ChatInterface.tsx', content);
  console.log("Replaced successfully");
} else {
  console.log("Could not find the effect to replace");
}
