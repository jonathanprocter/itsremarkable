const fs = require('fs');

// Read the file
let content = fs.readFileSync('routes.ts', 'utf8');

// Simple sequential replacements
content = content.replace(/`\[CALENDAR\] Found \$\{calendars\.length\} calendars to fetch from`/g, '"[CALENDAR] Found " + calendars.length + " calendars to fetch from"');
content = content.replace(/`\[DEBUG\] Fetching from calendar: \$\{cal\.summary\} \(\$\{cal\.id\}\)`/g, '"[DEBUG] Fetching from calendar: " + cal.summary + " (" + cal.id + ")"');
content = content.replace(/`\[SUCCESS\] Found \$\{allEvents\.length\} events in \$\{cal\.summary\} \(\$\{googleEventCount\} Google, \$\{simplePracticeEventCount\} SimplePractice\)`/g, '"[SUCCESS] Found " + allEvents.length + " events in " + cal.summary + " (" + googleEventCount + " Google, " + simplePracticeEventCount + " SimplePractice)"');
content = content.replace(/`\[WARNING\] Could not access calendar \$\{cal\.summary\}: \$\{calendarError\.message\}`/g, '"[WARNING] Could not access calendar " + cal.summary + ": " + calendarError.message');
content = content.replace(/`\[TARGET\] Total live Google Calendar events found: \$\{allGoogleEvents\.length\}`/g, '"[TARGET] Total live Google Calendar events found: " + allGoogleEvents.length');
content = content.replace(/`\[WARNING\] Could not save event \$\{evt\.title\}: \$\{err instanceof Error \? err\.message : String\(err\)\}`/g, '"[WARNING] Could not save event " + evt.title + ": " + (err instanceof Error ? err.message : String(err))');
content = content.replace(/`\[SAVE\] Saved \$\{savedCount\} events \(\$\{simplePracticeCount\} SimplePractice, \$\{googleCount\} Google\), removed \$\{deletedCount\} old events`/g, '"[SAVE] Saved " + savedCount + " events (" + simplePracticeCount + " SimplePractice, " + googleCount + " Google), removed " + deletedCount + " old events"');
content = content.replace(/`\[SUCCESS\] Fallback: Found \$\{formattedFallbackEvents\.length\} cached events \(\$\{spCount\} SimplePractice, \$\{gCount\} Google\)`/g, '"[SUCCESS] Fallback: Found " + formattedFallbackEvents.length + " cached events (" + spCount + " SimplePractice, " + gCount + " Google)"');
content = content.replace(/`Bearer \$\{accessToken\}`/g, '"Bearer " + accessToken');
content = content.replace(/`Bearer \$\{process\.env\.GOOGLE_ACCESS_TOKEN\}`/g, '"Bearer " + process.env.GOOGLE_ACCESS_TOKEN');

// Write back
fs.writeFileSync('routes.ts', content);
console.log('Fixed template literals');
