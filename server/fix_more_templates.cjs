const fs = require('fs');

let content = fs.readFileSync('routes.ts', 'utf8');

// Fix more template literals
content = content.replace(/`\$\{clientId\.substring\(0, 20\)\}\.\.\.`/g, 'clientId.substring(0, 20) + "..."');
content = content.replace(/`\[REFRESH\] Syncing events from \$\{calendars\.length\} calendars`/g, '"[REFRESH] Syncing events from " + calendars.length + " calendars"');
content = content.replace(/`Token refreshed for calendar \$\{cal\.summary\}`/g, '"Token refreshed for calendar " + cal.summary');
content = content.replace(/`Error syncing calendar \$\{cal\.summary\}:`/g, '"Error syncing calendar " + cal.summary + ":"');
content = content.replace(/`\[SUCCESS\] Sync completed: \$\{totalGoogleEvents\} Google events, \$\{totalSimplePracticeEvents\} SimplePractice events`/g, '"[SUCCESS] Sync completed: " + totalGoogleEvents + " Google events, " + totalSimplePracticeEvents + " SimplePractice events"');
content = content.replace(/`\[SUCCESS\] Found \$\{simplePracticeEvents\.length\} SimplePractice events in database`/g, '"[SUCCESS] Found " + simplePracticeEvents.length + " SimplePractice events in database"');
content = content.replace(/`\[TARGET\] Total SimplePractice events found: \$\{allSimplePracticeEvents\.length\}`/g, '"[TARGET] Total SimplePractice events found: " + allSimplePracticeEvents.length');
content = content.replace(/`\[SUCCESS\] Found \$\{googleEvents\.length\} Google Calendar events in database`/g, '"[SUCCESS] Found " + googleEvents.length + " Google Calendar events in database"');
content = content.replace(/`name='\$\{folderName\}' and mimeType='application\/vnd\.google-apps\.folder'`/g, '"name=\'" + folderName + "\' and mimeType=\'application/vnd.google-apps.folder\'"');

// Fix remaining template literals
content = content.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1" + $2 + "$3"');

// Clean up empty strings
content = content.replace(/"" \+ /g, '');
content = content.replace(/ \+ ""/g, '');

fs.writeFileSync('routes.ts', content);
console.log('Fixed more template literals');
