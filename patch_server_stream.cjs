const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  'if (response.body) {\n         response.body.pipe(res);\n         return;\n      }',
  `if (response.body) {\n         const reader = response.body.getReader();\n         const push = async () => {\n           while (true) {\n             const { done, value } = await reader.read();\n             if (done) {\n               res.end();\n               break;\n             }\n             res.write(value);\n           }\n         };\n         push();\n         return;\n      }`
);

fs.writeFileSync('server.ts', server);
console.log("Patched server.ts streaming");
