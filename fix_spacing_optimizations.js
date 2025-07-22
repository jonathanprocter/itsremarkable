// Fix spacing and text hierarchy optimizations for pixel-perfect PDF export
import fs from 'fs';

const filePath = 'client/src/utils/isolatedCalendarPDF.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all spacing improvements for better text hierarchy
const replacements = [
  // Title spacing
  {
    from: `            margin-bottom: 4px;
            color: #1E293B;`,
    to: `            margin-bottom: 6px;
            color: #1E293B;`
  },
  // Calendar source spacing  
  {
    from: `            color: #64748B;
            margin-bottom: 4px;
            word-wrap: break-word;`,
    to: `            color: #64748B;
            margin-bottom: 6px;
            word-wrap: break-word;`
  },
  // Event Notes header spacing
  {
    from: `                font-weight: 600; 
                margin-bottom: 4px; 
                text-decoration: underline;`,
    to: `                font-weight: 600; 
                margin-bottom: 6px; 
                text-decoration: underline;`
  },
  // Event Notes content spacing
  {
    from: `                  line-height: 1.4; 
                  margin-bottom: 4px;
                  color: #64748B;`,
    to: `                  line-height: 1.4; 
                  margin-bottom: 6px;
                  color: #64748B;`
  },
  // Action Items header spacing
  {
    from: `                font-weight: 600; 
                margin-bottom: 4px; 
                text-decoration: underline;
                color: #1E293B;`,
    to: `                font-weight: 600; 
                margin-bottom: 6px; 
                text-decoration: underline;
                color: #1E293B;`
  },
  // Action Items content spacing
  {
    from: `                  line-height: 1.4; 
                  margin-bottom: 4px;
                  color: #64748B;
                  word-wrap: break-word;
                  white-space: normal;
                  overflow-wrap: break-word;
                  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 100%;
                ">• \${item}</div>`,
    to: `                  line-height: 1.4; 
                  margin-bottom: 6px;
                  color: #64748B;
                  word-wrap: break-word;
                  white-space: normal;
                  overflow-wrap: break-word;
                  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 100%;
                ">• \${item}</div>`
  }
];

// Apply replacements
let updatedContent = content;
replacements.forEach((replacement, index) => {
  if (updatedContent.includes(replacement.from)) {
    updatedContent = updatedContent.replace(replacement.from, replacement.to);
    console.log(`✅ Applied spacing fix ${index + 1}`);
  } else {
    console.log(`⚠️ Spacing fix ${index + 1} not found - pattern may have changed`);
  }
});

// Write back to file
fs.writeFileSync(filePath, updatedContent);
console.log('📄 Spacing optimizations applied to isolatedCalendarPDF.ts');