const fs = require('fs');
let code = fs.readFileSync('plannerRouter.ts', 'utf8');
code = code.replace(
  'res.status(500).json({ error: "Failed to smartly add todo" });',
  'res.status(500).json({ error: "Failed to smartly add todo", details: error.message, stack: error.stack });'
);
fs.writeFileSync('plannerRouter.ts', code);
