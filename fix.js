const fs = require('fs');
let c = fs.readFileSync('ui-curriculum-map.js', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
fs.writeFileSync('ui-curriculum-map.js', c);
console.log('Fixed ui-curriculum-map.js');
