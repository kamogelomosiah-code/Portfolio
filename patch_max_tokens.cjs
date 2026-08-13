const fs = require('fs');
let code = fs.readFileSync('plannerRouter.ts', 'utf8');

code = code.replace(
  'response_format: { type: "json_object" },\n        temperature: 0.1\n      })',
  'response_format: { type: "json_object" },\n        temperature: 0.1,\n        max_tokens: 150\n      })'
);

fs.writeFileSync('plannerRouter.ts', code);
