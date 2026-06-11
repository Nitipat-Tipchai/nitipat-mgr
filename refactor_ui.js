const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, 'ui.js');
const indexPath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(uiPath, 'utf-8');

const lines = content.split('\n');
const sections = [];
let currentSection = { name: 'core', lines: [] };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('════════════') || line.includes('============')) {
    if (i + 1 < lines.length) {
      const titleLine = lines[i+1].trim();
      let name = '';
      if (titleLine.includes('DASHBOARD')) name = 'dashboard';
      else if (titleLine.includes('SCHEDULE')) name = 'schedule';
      else if (titleLine.includes('ASSIGNMENTS')) name = 'assignments';
      else if (titleLine.includes('EXAMS')) name = 'exams';
      else if (titleLine.includes('GRADES')) name = 'grades';
      else if (titleLine.includes('ROADMAP')) name = 'roadmap';
      else if (titleLine.includes('CALENDAR SETTINGS')) name = 'calendar';
      else if (titleLine.includes('FOCUS MODE')) name = 'focus';
      else if (titleLine.includes('CLUB')) name = 'club';
      else if (titleLine.includes('MONEYPOD (PERSONAL FINANCE HUB)')) name = 'moneypod';
      else if (titleLine.includes('SETTINGS')) name = 'settings';
      else if (titleLine.includes('CSS OVERRIDES')) name = 'styles';
      else if (titleLine.includes('FORMS')) name = 'forms';
      else if (titleLine.includes('CONFETTI')) name = 'utils';
      else if (titleLine.includes('EXPOSE TO WINDOW')) name = 'core2';
      
      if (name) {
        sections.push(currentSection);
        currentSection = { name, lines: [line] };
        continue;
      }
    }
  } else if (line.includes('* SMART DRIVE SYSTEM')) {
    sections.push(currentSection);
    currentSection = { name: 'drive', lines: [line] };
    continue;
  } else if (line.includes('* NOTION INTEGRATION HUB')) {
    sections.push(currentSection);
    currentSection = { name: 'notion', lines: [line] };
    continue;
  }
  
  currentSection.lines.push(line);
}
sections.push(currentSection);

// Write sections to files
const generatedScripts = [];
const scriptTags = [];

for (const sec of sections) {
  if (sec.lines.length < 5 && sec.name !== 'core' && sec.name !== 'core2') continue; // skip empty headers
  let fileName = `ui-${sec.name}.js`;
  if (sec.name === 'core' || sec.name === 'core2') fileName = 'ui-core.js';
  
  const secContent = sec.lines.join('\n');
  if (fileName === 'ui-core.js' && fs.existsSync(path.join(__dirname, fileName))) {
    fs.appendFileSync(path.join(__dirname, fileName), '\n' + secContent);
  } else {
    fs.writeFileSync(path.join(__dirname, fileName), secContent);
    if (!generatedScripts.includes(fileName)) {
      generatedScripts.push(fileName);
      scriptTags.push(`<script src="${fileName}"></script>`);
    }
  }
}

// Update index.html
let indexContent = fs.readFileSync(indexPath, 'utf-8');
const scriptReplacement = scriptTags.join('\n    ');
indexContent = indexContent.replace(/<script src="ui\.js"><\/script>/, scriptReplacement);
fs.writeFileSync(indexPath, indexContent);

// Rename original ui.js to avoid double loading if something weird happens, or keep it as backup
fs.renameSync(uiPath, path.join(__dirname, 'ui_backup.js'));

console.log('Successfully split ui.js into:');
console.log(generatedScripts.join(', '));
