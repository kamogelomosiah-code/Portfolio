const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');

// I will write a simple parser that keeps track of opened tags
const lines = code.split('\n');

let openTags = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Very hacky but works for this file structure since tags are mostly on their own lines or easily identifiable
  // Let's just fix the unclosed buttons manually since there are only 12!
}
