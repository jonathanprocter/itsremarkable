const fs = require('fs');

// Read the file
let content = fs.readFileSync('routes.ts', 'utf8');

// Replace all template literals step by step
const fixes = [
  // Replace console.log template literals
  [/console\.log\(`\[([A-Z]+)\] ([^`]*)\$\{([^}]+)\}([^`]*)`\)/g, 'console.log("[$1] $2" + $3 + "$4")'],
  [/console\.log\(`\[([A-Z]+)\] ([^`]*)\$\{([^}]+)\}([^`]*)\$\{([^}]+)\}([^`]*)`\)/g, 'console.log("[$1] $2" + $3 + "$4" + $5 + "$6")'],
  
  // Replace simple template literals
  [/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1" + $2 + "$3"'],
  [/`([^`]*)\$\{([^}]+)\}([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1" + $2 + "$3" + $4 + "$5"'],
  
  // Clean up empty strings
  [/"" \+ /g, ''],
  [/ \+ ""/g, ''],
  [/\+ "" \+/g, '+'],
];

// Apply each fix
fixes.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// Write back
fs.writeFileSync('routes.ts', content);
console.log('Fixed template literals');
