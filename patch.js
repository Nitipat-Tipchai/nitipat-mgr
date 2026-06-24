const fs = require('fs');
let code = fs.readFileSync('managers2.js', 'utf8');

const target1 = `<button class="nav-tab-btn \${tab === 'Settings' ? 'active' : ''}" onclick="state.activeHubTab='Settings'; render();">`;
const replace1 = `<button class="nav-tab-btn \${tab === 'Tasks' ? 'active' : ''}" onclick="state.activeHubTab='Tasks'; render();">
               <div style="font-size:26px; \${tab !== 'Tasks' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">⚡</div>
               \${tab === 'Tasks' ? '<div class="tab-label">Tasks</div>' : ''}
             </button>
             <button class="nav-tab-btn \${tab === 'Settings' ? 'active' : ''}" onclick="state.activeHubTab='Settings'; render();">`;

const target2 = `tab === 'Files' ? renderCourseFiles(c) :`;
const replace2 = `tab === 'Files' ? renderCourseFiles(c) :
              tab === 'Tasks' ? (typeof renderCourseTasks === 'function' ? renderCourseTasks(c) : '') :`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync('managers2.js', code);
console.log('patched');
