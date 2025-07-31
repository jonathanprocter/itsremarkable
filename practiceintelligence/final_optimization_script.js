// Final optimization script to achieve 100% pixel-perfect PDF export
import fs from 'fs';

const filePath = 'client/src/utils/isolatedCalendarPDF.ts';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎯 Applying final optimizations for 100% pixel-perfect matching...');

// Final optimizations for remaining issues
const finalOptimizations = [
  // Further increase minimum height for perfect content visibility
  {
    from: `  const height = Math.max(dynamicHeight, 140);`,
    to: `  const height = Math.max(dynamicHeight, 160);`,
    description: 'Increase minimum height to 160px for complete content visibility'
  },
  // Enhanced dynamic height calculation  
  {
    from: `  const dynamicHeight = Math.max(140, baseHeight + (contentLines * 20));`,
    to: `  const dynamicHeight = Math.max(160, baseHeight + (contentLines * 25));`,
    description: 'Improved dynamic height with 25px per content line'
  },
  // Update minimum grid height
  {
    from: `        min-height: 140px;`,
    to: `        min-height: 160px;`,
    description: 'Update grid minimum height to match event height'
  },
  // Enhanced padding for better content spacing
  {
    from: `      padding: 8px 12px;`,
    to: `      padding: 12px 16px;`,
    description: 'Increase padding for better content breathing room'
  },
  // Improved gap in left column for text hierarchy
  {
    from: `          gap: 6px;`,
    to: `          gap: 8px;`,
    description: 'Enhanced left column gap for better text hierarchy'
  },
  // Perfect center and right column gaps
  {
    from: `          gap: 3px;`,
    to: `          gap: 6px;`,
    description: 'Consistent gap spacing across all columns'
  },
  // Enhanced grid gap for better column separation
  {
    from: `        gap: 16px;`,
    to: `        gap: 20px;`,
    description: 'Increase grid gap for better column visual separation'
  },
  // Improved time display positioning
  {
    from: `            margin-top: 4px;`,
    to: `            margin-top: 6px;`,
    description: 'Better time display positioning below source'
  }
];

// Apply optimizations
let updatedContent = content;
let appliedCount = 0;

finalOptimizations.forEach((optimization, index) => {
  if (updatedContent.includes(optimization.from)) {
    updatedContent = updatedContent.replace(optimization.from, optimization.to);
    console.log(`✅ ${optimization.description}`);
    appliedCount++;
  } else {
    console.log(`⚠️ Optimization ${index + 1} not found - pattern may have changed`);
  }
});

// Write back to file
fs.writeFileSync(filePath, updatedContent);
console.log(`📄 Applied ${appliedCount}/${finalOptimizations.length} final optimizations`);
console.log('🎯 PDF export should now be approaching 100% pixel-perfect matching');