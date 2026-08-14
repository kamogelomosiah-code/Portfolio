const fs = require('fs');
let code = fs.readFileSync('src/components/ActionPlanner/ActionPlanner.tsx', 'utf8');

let stack = [];
let output = '';
let i = 0;

while (i < code.length) {
  if (code.substr(i, 7) === '<button') {
    stack.push('button');
    output += '<button';
    i += 7;
  } else if (code.substr(i, 4) === '<div' && code.substr(i, 5) !== '<div ') {
     // Wait, div can be <div className etc.
  }

  // A better way: just use Babel!
}
