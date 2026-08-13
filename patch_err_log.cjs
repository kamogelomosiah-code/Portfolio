const fs = require('fs');
let code = fs.readFileSync('plannerRouter.ts', 'utf8');
code = code.replace(
  'if (!response.ok) {\n      throw new Error("OpenRouter API error");\n    }',
  'if (!response.ok) {\n      const errText = await response.text();\n      throw new Error(`OpenRouter API error: ${response.status} ${errText}`);\n    }'
);
fs.writeFileSync('plannerRouter.ts', code);
