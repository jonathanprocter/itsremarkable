const fs = require('fs');

const content = fs.readFileSync('server/routes.ts', 'utf8');
const lines = content.split('\n');

console.log('Looking for unterminated string literals...');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for odd number of quotes
  const singleQuotes = (line.match(/'/g) || []).length;
  const doubleQuotes = (line.match(/"/g) || []).length;
  
  if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
    console.log(`Line ${i + 1}: ${line}`);
  }
  
  // Check for specific problematic patterns
  if (line.includes('ETag') || line.includes('auth-')) {
    console.log(`ETag line ${i + 1}: ${line}`);
  }
}

console.log('\nChecking around line 2675...');
for (let i = 2670; i < 2680; i++) {
  if (lines[i]) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}