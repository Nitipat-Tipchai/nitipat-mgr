const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ui.js');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
const headers = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('════════════') || lines[i].includes('============')) {
    // look at the next line for the title
    if (i + 1 < lines.length) {
      const title = lines[i+1].trim();
      headers.push(`Line ${i+1}: ${title}`);
    }
  }
}

console.log(headers.join('\n'));
