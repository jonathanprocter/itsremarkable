#!/bin/bash

echo "🧹 CLEANING UP OAUTH HELL..."

# Create backup directory
mkdir -p server/oauth_backup_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="server/oauth_backup_$(date +%Y%m%d_%H%M%S)"

echo "📦 Backing up current files to $BACKUP_DIR..."

# Backup current routes.ts
cp server/routes.ts $BACKUP_DIR/routes.ts.backup

# Move all conflicting OAuth files to backup
echo "🗂️  Moving conflicting OAuth files to backup..."

# List of conflicting OAuth files to move
oauth_files=(
    "server/auth-fix.ts"
    "server/auth-status.ts" 
    "server/auth-sync.ts"
    "server/clean-auth.ts"
    "server/comprehensive-auth-fix.ts"
    "server/deployment-auth-fix.ts"
    "server/direct-google-api.ts"
    "server/direct-google-auth.ts"
    "server/fresh-google-auth.ts"
    "server/google-auth-debug.ts"
    "server/google-auth-fix.ts"
    "server/oauth-completion-handler.ts"
    "server/simple-auth.ts"
    "server/token-refresh.ts"
)

# Move each file if it exists
for file in "${oauth_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  📝 Moving $file"
        mv "$file" "$BACKUP_DIR/"
    fi
done

echo "✅ OAuth cleanup complete!"
echo ""
echo "📋 SUMMARY:"
echo "  ✅ Backed up current routes.ts"
echo "  ✅ Moved ${#oauth_files[@]} conflicting OAuth files to backup"
echo "  ✅ Ready for clean OAuth implementation"
echo ""
echo "🚀 NEXT STEPS:"
echo "  1. Replace server/routes.ts with the clean implementation"
echo "  2. Update Google Cloud Console redirect URIs"
echo "  3. Test OAuth flow"
echo ""
echo "📂 Backup location: $BACKUP_DIR"
echo "   (You can restore from here if needed)"
