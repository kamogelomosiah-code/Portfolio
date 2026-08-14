const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');
const lines = code.split('\n');

const toReplace = [234, 262, 322, 329, 445, 490, 515, 522]; // 0-indexed

for (const idx of toReplace) {
  lines[idx] = lines[idx].replace('</div>', '</button>');
}

fs.writeFileSync('src/components/ActionPlanner/ActionPlanner.tsx', lines.join('\n'));
