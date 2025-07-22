#!/usr/bin/env python3
"""
Implementation-Specific Audit Script
Checks for actual CSS and implementation issues causing alignment problems
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple

class ImplementationAudit:
    def __init__(self):
        self.score = 100
        self.issues = []
        self.project_root = Path(".")
    
    def audit_css_implementation(self) -> None:
        """Audit the actual CSS implementation in index.css"""
        print("🔍 AUDITING CSS IMPLEMENTATION")
        
        css_file = self.project_root / "client" / "src" / "index.css"
        if not css_file.exists():
            self.issues.append({
                "type": "CRITICAL",
                "description": "index.css file not found",
                "severity": -50
            })
            return
        
        css_content = css_file.read_text()
        
        # Check schedule-grid structure
        if ".schedule-grid" in css_content:
            print("  ✅ Found .schedule-grid CSS class")
            
            # Extract schedule-grid CSS block
            grid_match = re.search(r'\.schedule-grid\s*\{([^}]+)\}', css_content, re.DOTALL)
            if grid_match:
                grid_css = grid_match.group(1)
                print(f"  📋 Current .schedule-grid CSS:\n{grid_css}")
                
                # Check for required properties
                required_props = {
                    "display": "grid",
                    "grid-template-columns": "80px 1fr",
                    "grid-template-rows": "repeat(36, 40px)",
                    "height": "1440px"
                }
                
                for prop, expected_value in required_props.items():
                    if prop not in grid_css:
                        self.issues.append({
                            "type": "CRITICAL", 
                            "description": f"Missing {prop} in .schedule-grid",
                            "fix": f"Add: {prop}: {expected_value};",
                            "severity": -15
                        })
                    else:
                        print(f"    ✅ Has {prop}")
        else:
            self.issues.append({
                "type": "CRITICAL",
                "description": "Missing .schedule-grid CSS class",
                "severity": -25
            })
        
        # Check appointments-column implementation
        if ".appointments-column" in css_content:
            print("  ✅ Found .appointments-column CSS class")
            
            appt_match = re.search(r'\.appointments-column\s*\{([^}]+)\}', css_content, re.DOTALL)
            if appt_match:
                appt_css = appt_match.group(1)
                print(f"  📋 Current .appointments-column CSS:\n{appt_css}")
                
                # Check for absolute positioning support
                if "position: relative" not in appt_css:
                    self.issues.append({
                        "type": "CRITICAL",
                        "description": "appointments-column missing position: relative for absolute positioning",
                        "fix": "Add: position: relative;",
                        "severity": -20
                    })
                else:
                    print("    ✅ Has position: relative")
        
        # Check full-width background implementation
        if "::before" in css_content and "repeating-linear-gradient" in css_content:
            print("  ✅ Found full-width background implementation")
        else:
            self.issues.append({
                "type": "HIGH",
                "description": "Missing full-width background with ::before pseudo-element",
                "fix": "Add ::before with repeating-linear-gradient for full-width grey backgrounds",
                "severity": -15
            })
    
    def audit_tsx_implementation(self) -> None:
        """Audit the TSX implementation for positioning logic"""
        print("\n🔍 AUDITING TSX IMPLEMENTATION")
        
        daily_view_file = self.project_root / "client" / "src" / "components" / "calendar" / "DailyView.tsx"
        if not daily_view_file.exists():
            self.issues.append({
                "type": "CRITICAL", 
                "description": "DailyView.tsx file not found",
                "severity": -50
            })
            return
        
        tsx_content = daily_view_file.read_text()
        
        # Check for positioning calculation logic
        if "topPosition" in tsx_content and "Math.floor(minutesSince6am / 30) * 40" in tsx_content:
            print("  ✅ Found correct positioning calculation logic")
        else:
            self.issues.append({
                "type": "CRITICAL",
                "description": "Missing or incorrect positioning calculation in DailyView.tsx",
                "fix": "Implement: const topPosition = Math.floor(minutesSince6am / 30) * 40;",
                "severity": -25
            })
        
        # Check for absolute positioning in style return
        if "position: 'absolute'" in tsx_content:
            print("  ✅ Found absolute positioning in event styles")
        else:
            self.issues.append({
                "type": "CRITICAL",
                "description": "Events not using absolute positioning",
                "fix": "Return style with position: 'absolute', top: topPosition + 'px'",
                "severity": -25
            })
        
        # Check for appointment-slot removal (should not be there with absolute positioning)
        if "appointment-slot" in tsx_content and "timeSlots.map" in tsx_content:
            slot_count = tsx_content.count("appointment-slot")
            if slot_count > 1:  # Allow for CSS class references but not JSX rendering
                self.issues.append({
                    "type": "HIGH",
                    "description": "Still rendering appointment-slot elements - conflicts with absolute positioning",
                    "fix": "Remove timeSlots.map rendering of appointment-slot divs",
                    "severity": -15
                })
        else:
            print("  ✅ Appointment slots properly removed for absolute positioning")
    
    def check_common_alignment_issues(self) -> None:
        """Check for common issues that cause alignment problems"""
        print("\n🔍 CHECKING COMMON ALIGNMENT ISSUES")
        
        # Issue 1: Box-sizing conflicts
        css_file = self.project_root / "client" / "src" / "index.css"
        if css_file.exists():
            css_content = css_file.read_text()
            
            # Check if appointments have proper box-sizing
            if "box-sizing: border-box" in css_content:
                print("  ✅ Found box-sizing: border-box")
            else:
                self.issues.append({
                    "type": "MEDIUM",
                    "description": "Missing box-sizing: border-box may cause sizing issues",
                    "fix": "Add box-sizing: border-box to appointment CSS",
                    "severity": -10
                })
            
            # Check for margin/padding conflicts
            appt_css_match = re.search(r'\.appointment[^{]*\{([^}]+)\}', css_content)
            if appt_css_match:
                appt_css = appt_css_match.group(1)
                if "margin: 0" in appt_css or "margin: 1px" in appt_css:
                    print("  ✅ Appointments have controlled margins")
                else:
                    self.issues.append({
                        "type": "MEDIUM",
                        "description": "Appointment margins may cause positioning issues",
                        "fix": "Set margin: 0 4px for appointments",
                        "severity": -8
                    })
    
    def generate_fix_instructions(self) -> None:
        """Generate specific fix instructions based on found issues"""
        print("\n🛠️ SPECIFIC FIX INSTRUCTIONS")
        
        if not self.issues:
            print("✅ No implementation issues found!")
            return
        
        critical_issues = [i for i in self.issues if i["type"] == "CRITICAL"]
        high_issues = [i for i in self.issues if i["type"] == "HIGH"] 
        medium_issues = [i for i in self.issues if i["type"] == "MEDIUM"]
        
        if critical_issues:
            print("\n🚨 CRITICAL FIXES (Must fix first):")
            for i, issue in enumerate(critical_issues, 1):
                print(f"  {i}. {issue['description']}")
                if 'fix' in issue:
                    print(f"     Fix: {issue['fix']}")
        
        if high_issues:
            print("\n⚠️ HIGH PRIORITY FIXES:")
            for i, issue in enumerate(high_issues, 1):
                print(f"  {i}. {issue['description']}")
                if 'fix' in issue:
                    print(f"     Fix: {issue['fix']}")
        
        if medium_issues:
            print("\n📋 MEDIUM PRIORITY FIXES:")
            for i, issue in enumerate(medium_issues, 1):
                print(f"  {i}. {issue['description']}")
                if 'fix' in issue:
                    print(f"     Fix: {issue['fix']}")
    
    def run_audit(self) -> Dict[str, Any]:
        """Run the complete implementation audit"""
        print("=" * 80)
        print("🔧 IMPLEMENTATION-SPECIFIC AUDIT")
        print("=" * 80)
        print("Checking actual CSS and TSX files for alignment issues...\n")
        
        self.audit_css_implementation()
        self.audit_tsx_implementation()
        self.check_common_alignment_issues()
        
        # Calculate final score
        total_penalty = sum(issue.get("severity", 0) for issue in self.issues)
        self.score += total_penalty
        self.score = max(0, self.score)  # Don't go below 0
        
        print("\n" + "=" * 80)
        print("📊 IMPLEMENTATION AUDIT RESULTS")
        print("=" * 80)
        print(f"🏆 Implementation Score: {self.score}/100")
        print(f"❌ Issues Found: {len(self.issues)}")
        
        self.generate_fix_instructions()
        
        return {
            "score": self.score,
            "total_issues": len(self.issues),
            "issues": self.issues,
            "critical_issues": len([i for i in self.issues if i["type"] == "CRITICAL"]),
            "high_issues": len([i for i in self.issues if i["type"] == "HIGH"]),
            "medium_issues": len([i for i in self.issues if i["type"] == "MEDIUM"])
        }

def main():
    auditor = ImplementationAudit()
    results = auditor.run_audit()
    
    # Save results
    with open('implementation_audit_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: implementation_audit_results.json")

if __name__ == "__main__":
    main()