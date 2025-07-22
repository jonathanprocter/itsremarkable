console.log('Testing current weekly export import...');
import('./src/utils/currentWeeklyExport.js').then(module => {
  console.log('Module imported successfully:', module);
  console.log('Functions available:', Object.keys(module));
}).catch(error => {
  console.error('Import failed:', error);
});
