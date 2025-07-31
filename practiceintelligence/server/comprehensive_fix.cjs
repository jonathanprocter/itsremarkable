const fs = require('fs');
let content = fs.readFileSync('routes.ts', 'utf8');

// Replace all template literals with simple string concatenation
// This will avoid the syntax errors caused by template literal parsing

// First fix the most common patterns
content = content.replace(/console\.log\(`\[([A-Z]+)\] ([^`]*)`\)/g, (match, level, message) => {
  // Replace ${variable} with " + variable + "
  const fixedMessage = message.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
  return `console.log("[${level}] ${fixedMessage}")`;
});

// Fix remaining template literals
content = content.replace(/`([^`]*)`/g, (match, inner) => {
  // Replace ${variable} with " + variable + "
  const fixed = inner.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
  return `"${fixed}"`;
});

// Clean up double quotes and empty concatenations
content = content.replace(/"" \+ /g, '');
content = content.replace(/ \+ ""/g, '');
content = content.replace(/"\s*\+\s*"/g, '');
content = content.replace(/\+\s*""\s*\+/g, ' + ');

// Fix any remaining issues
content = content.replace(/"\s*\+\s*\+\s*"/g, '');
content = content.replace(/\"\+\"/g, '');

fs.writeFileSync('routes.ts', content);
console.log('Fixed all template literals comprehensively');
