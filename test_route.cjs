const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/planner/smart-add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data));
});
req.write(JSON.stringify({ prompt: "buy milk" }));
req.end();
