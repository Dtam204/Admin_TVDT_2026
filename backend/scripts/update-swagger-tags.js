const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');

const publicRoutes = [
  'reader.routes.js',
  'public_publication.routes.js',
  'auth.routes.js',
  'health.routes.js'
];

const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (publicRoutes.includes(file)) {
    // Prefix with Public
    content = content.replace(/tags:\s*\[([^\]]+)\]/g, (match, tag) => {
      let cleanTag = tag.trim().replace(/^['"]|['"]$/g, '');
      if (!cleanTag.toLowerCase().includes('public') && !cleanTag.toLowerCase().includes('reader')) {
        return 'tags: [Public ' + cleanTag + ']';
      }
      return match;
    });

    content = content.replace(/tags:\n\s*-\s*([^\n]+)/g, (match, tag) => {
      let cleanTag = tag.trim().replace(/^['"]|['"]$/g, '');
      if (!cleanTag.toLowerCase().includes('public') && !cleanTag.toLowerCase().includes('reader')) {
        return 'tags:\n *       - Public ' + cleanTag;
      }
      return match;
    });

  } else {
    // Prefix with Admin
    content = content.replace(/tags:\s*\[([^\]]+)\]/g, (match, tag) => {
      let cleanTag = tag.trim().replace(/^['"]|['"]$/g, '');
      if (!cleanTag.toLowerCase().includes('admin')) {
        return 'tags: [Admin ' + cleanTag + ']';
      }
      return match;
    });

    content = content.replace(/tags:\n\s*\*\s*-\s*([^\n]+)/g, (match, tag) => {
      let cleanTag = tag.trim().replace(/^['"]|['"]$/g, '');
      if (!cleanTag.toLowerCase().includes('admin')) {
        return 'tags:\n *       - Admin ' + cleanTag;
      }
      return match;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
}
