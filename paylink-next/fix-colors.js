const fs = require('fs');
const files = ['app/page.tsx', 'app/dashboard/page.tsx', 'app/c/page.tsx', 'app/create/page.tsx'];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/color:\s*['"]white['"]/g, "color: 'var(--text-primary)'");
  fs.writeFileSync(f, c);
  console.log('Updated ' + f);
});
