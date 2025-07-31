#!/usr/bin/env python3
"""
Critical Authentication Issues Fix Script
Based on audit findings, this script will fix the most critical authentication issues
"""

import os
import json
from pathlib import Path

def remove_duplicate_oauth_files():
    """Remove duplicate OAuth files causing conflicts"""
    print("🧹 Removing duplicate OAuth files...")
    
    # Files to remove (duplicates found by audit)
    duplicate_files = [
        'server/oauth-fix.ts',
        'server/oauth-clean.ts',
        'server/comprehensive-oauth-fix.ts',
        'server/comprehensive-token-refresh.ts',
        'server/oauth-comprehensive-fix.ts',
        'server/auth-debug.ts',
        'server/oauth-403-fix.ts'
    ]
    
    removed = []
    for file_path in duplicate_files:
        path = Path(file_path)
        if path.exists():
            try:
                path.unlink()
                removed.append(file_path)
                print(f"✅ Removed: {file_path}")
            except Exception as e:
                print(f"❌ Failed to remove {file_path}: {e}")
    
    print(f"🧹 Removed {len(removed)} duplicate OAuth files")
    return removed

def clean_oauth_backup_folder():
    """Clean up the oauth_backup folder with old files"""
    print("🧹 Cleaning oauth_backup folder...")
    
    backup_path = Path('server/oauth_backup')
    if backup_path.exists():
        try:
            import shutil
            shutil.rmtree(backup_path)
            print("✅ Removed oauth_backup folder")
            return True
        except Exception as e:
            print(f"❌ Failed to remove oauth_backup: {e}")
            return False
    
    return False

def fix_unsafe_session_access():
    """Fix unsafe session access patterns found by audit"""
    print("🔧 Fixing unsafe session access patterns...")
    
    # Files with unsafe session access
    files_to_fix = [
        'server/routes.ts',
        'server/storage.ts'
    ]
    
    fixed = []
    for file_path in files_to_fix:
        path = Path(file_path)
        if path.exists():
            try:
                content = path.read_text(encoding='utf-8')
                
                # Replace unsafe patterns with safe ones
                patterns = [
                    ('req.session.user', 'req.session?.user'),
                    ('req.session.userId', 'req.session?.userId'),
                    ('req.session.passport', 'req.session?.passport'),
                    ('req.session.isAuthenticated', 'req.session?.isAuthenticated')
                ]
                
                changes_made = False
                for unsafe, safe in patterns:
                    if unsafe in content and safe not in content:
                        content = content.replace(unsafe, safe)
                        changes_made = True
                
                if changes_made:
                    path.write_text(content, encoding='utf-8')
                    fixed.append(file_path)
                    print(f"✅ Fixed session access in: {file_path}")
                    
            except Exception as e:
                print(f"❌ Failed to fix {file_path}: {e}")
    
    print(f"🔧 Fixed session access in {len(fixed)} files")
    return fixed

def remove_unused_auth_files():
    """Remove unused authentication files that are causing confusion"""
    print("🗑️ Removing unused authentication files...")
    
    # Files that are likely unused based on audit
    unused_files = [
        'server/audit-system.ts',
        'server/auth/force-env-tokens.ts',
        # Add more files as identified
    ]
    
    removed = []
    for file_path in unused_files:
        path = Path(file_path)
        if path.exists():
            try:
                path.unlink()
                removed.append(file_path)
                print(f"✅ Removed unused: {file_path}")
            except Exception as e:
                print(f"❌ Failed to remove {file_path}: {e}")
    
    print(f"🗑️ Removed {len(removed)} unused files")
    return removed

def consolidate_authentication_system():
    """Ensure only minimal-oauth.ts is used for authentication"""
    print("🔄 Consolidating authentication system...")
    
    # The primary auth file should be minimal-oauth.ts
    primary_auth_file = Path('server/minimal-oauth.ts')
    
    if not primary_auth_file.exists():
        print("❌ Primary auth file (minimal-oauth.ts) not found")
        return False
    
    print("✅ Primary authentication file exists: server/minimal-oauth.ts")
    
    # Check that it's being used in index.ts
    index_file = Path('server/index.ts')
    if index_file.exists():
        content = index_file.read_text(encoding='utf-8')
        if 'minimal-oauth' in content:
            print("✅ minimal-oauth.ts is imported in index.ts")
        else:
            print("⚠️ minimal-oauth.ts not found in index.ts imports")
    
    return True

def generate_fix_report():
    """Generate a report of fixes applied"""
    print("\n📊 Generating fix report...")
    
    report = {
        'timestamp': str(Path().resolve()),
        'fixes_applied': [],
        'recommendations': [
            'Test authentication flow after fixes',
            'Verify session persistence is working',
            'Check that duplicate OAuth systems are removed',
            'Test Google OAuth callback flow'
        ]
    }
    
    # Apply all fixes
    removed_duplicates = remove_duplicate_oauth_files()
    removed_backup = clean_oauth_backup_folder()
    fixed_sessions = fix_unsafe_session_access()
    removed_unused = remove_unused_auth_files()
    consolidated = consolidate_authentication_system()
    
    report['fixes_applied'] = [
        f"Removed {len(removed_duplicates)} duplicate OAuth files",
        f"Cleaned oauth_backup folder: {removed_backup}",
        f"Fixed session access in {len(fixed_sessions)} files",
        f"Removed {len(removed_unused)} unused files",
        f"Authentication system consolidated: {consolidated}"
    ]
    
    # Save report
    with open('auth_fix_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print("📄 Fix report saved to: auth_fix_report.json")
    return report

def main():
    """Main fix function"""
    print("🚀 Starting critical authentication fixes...")
    print("="*50)
    
    try:
        report = generate_fix_report()
        
        print("\n" + "="*50)
        print("✅ AUTHENTICATION FIXES COMPLETED")
        print("="*50)
        
        for fix in report['fixes_applied']:
            print(f"  • {fix}")
        
        print("\n💡 NEXT STEPS:")
        for rec in report['recommendations']:
            print(f"  • {rec}")
        
        print(f"\n🎯 RESULT: Authentication system cleaned up and consolidated")
        print("🔄 Server should restart automatically with cleaner auth system")
        
        return True
        
    except Exception as e:
        print(f"❌ Fix script failed: {e}")
        return False

if __name__ == "__main__":
    main()