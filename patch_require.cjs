const fs = require('fs');
let code = fs.readFileSync('plannerRouter.ts', 'utf8');

code = code.replace(
  "require('crypto').randomUUID()",
  "uuidv4()"
);

fs.writeFileSync('plannerRouter.ts', code);
