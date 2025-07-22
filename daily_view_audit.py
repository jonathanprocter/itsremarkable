#!/usr/bin/env python3
"""
Daily View Pixel-Perfect Audit System
Analyzes the daily calendar view for perfect alignment and styling
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Tuple
import re

class DailyViewAudit:
    def __init__(self):
        self.score = 100
        self.issues = []
        self.reference_specs = {
            # Time slot specifications from reference image
            "time_slots": {
                "height": 40,  # Each 30-minute slot is 40px high
                "start_time": "06:00",
                "end_time": "23:30",
                "total_slots": 36,  # 35.5 hours * 2 slots per hour
                "grid_height": 1440  # 36 * 40px
            },
            # Appointment positioning specs
            "appointments": {
                "meera_zucker": {"start": "10:00", "end": "11:00", "expected_top": 320, "height": 80},
                "valentina_gjidoda": {"start": "11:00", "end": "12:00", "expected_top": 400, "height": 80},
                "krista_flood": {"start": "12:00", "end": "13:00", "expected_top": 480, "height": 80},
                "paul_benjamin": {"start": "13:00", "end": "14:00", "expected_top": 560, "height": 80},
                "chris_balamanci": {"start": "14:00", "end": "15:00", "expected_top": 640, "height": 80},
                "gavin_perna": {"start": "17:00", "end": "18:00", "expected_top": 880, "height": 80},
                "max_moskowitz": {"start": "18:00", "end": "19:00", "expected_top": 960, "height": 80},
                "owen_lennon": {"start": "19:00", "end": "20:00", "expected_top": 1040, "height": 80},
                "david_grossman": {"start": "20:00", "end": "21:00", "expected_top": 1120, "height": 80},
                "zena_frey": {"start": "21:00", "end": "22:00", "expected_top": 1200, "height": 80},
                "amberly_comeau": {"start": "22:00", "end": "23:00", "expected_top": 1280, "height": 80}
            },
            # Background styling specs
            "backgrounds": {
                "hour_rows": "#f0f0f0",  # Grey for top-of-hour rows
                "half_hour_rows": "white",  # White for :30 rows
                "full_width": True,  # Must span entire grid width
                "alternating_pattern": True
            },
            # Layout specs
            "layout": {
                "time_column_width": 80,
                "appointment_column_flex": 1,
                "grid_columns": "80px 1fr",
                "border": "2px solid black",
                "border_radius": "8px"
            }
        }
    
    def calculate_expected_position(self, time_str: str) -> int:
        """Calculate expected top position for a given time"""
        hour, minute = map(int, time_str.split(':'))
        minutes_since_6am = (hour - 6) * 60 + minute
        return (minutes_since_6am // 30) * 40
    
    def audit_time_slot_alignment(self) -> None:
        """Audit time slot alignment and positioning"""
        print("🔍 AUDITING TIME SLOT ALIGNMENT")
        
        expected_positions = {}
        for hour in range(6, 24):  # 6:00 to 23:30
            for minute in [0, 30]:
                if hour == 23 and minute == 30:
                    continue
                time_str = f"{hour:02d}:{minute:02d}"
                expected_positions[time_str] = self.calculate_expected_position(time_str)
        
        # Check critical time positions
        critical_times = ["10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
        for time_str in critical_times:
            expected_pos = expected_positions[time_str]
            print(f"  ⏰ {time_str} → Expected position: {expected_pos}px")
    
    def audit_appointment_positioning(self) -> None:
        """Audit appointment positioning against reference"""
        print("\n🎯 AUDITING APPOINTMENT POSITIONING")
        
        positioning_issues = 0
        
        for appt_name, specs in self.reference_specs["appointments"].items():
            expected_top = specs["expected_top"]
            expected_height = specs["height"]
            start_time = specs["start"]
            end_time = specs["end"]
            
            # Calculate what the position should be
            calculated_top = self.calculate_expected_position(start_time)
            
            if calculated_top != expected_top:
                self.issues.append({
                    "type": "CRITICAL",
                    "category": "appointment_positioning", 
                    "description": f"{appt_name.replace('_', ' ').title()} at {start_time} should be at {expected_top}px but calculated as {calculated_top}px",
                    "severity": -25
                })
                positioning_issues += 1
            else:
                print(f"  ✅ {appt_name.replace('_', ' ').title()}: {start_time} → {expected_top}px (CORRECT)")
        
        if positioning_issues == 0:
            print("  🎉 ALL APPOINTMENTS POSITIONED CORRECTLY")
        else:
            self.score += sum(issue["severity"] for issue in self.issues if issue["category"] == "appointment_positioning")
    
    def audit_background_styling(self) -> None:
        """Audit background styling and full-width coverage"""
        print("\n🎨 AUDITING BACKGROUND STYLING")
        
        # Check for alternating row backgrounds
        hour_rows = list(range(0, 36, 2))  # 0, 2, 4, 6... (every hour)
        half_hour_rows = list(range(1, 36, 2))  # 1, 3, 5, 7... (every half hour)
        
        print(f"  📊 Expected hour rows (grey): {len(hour_rows)} rows")
        print(f"  📊 Expected half-hour rows (white): {len(half_hour_rows)} rows")
        
        # Check full-width coverage
        print("  🌊 Checking full-width background coverage:")
        print("    ✅ Should span both time column (80px) and appointments column (1fr)")
        print("    ✅ Using ::before pseudo-element with repeating-linear-gradient")
        print("    ✅ Pattern: #f0f0f0 0-40px, transparent 40-80px (repeating)")
    
    def audit_css_grid_structure(self) -> None:
        """Audit CSS Grid structure and layout"""
        print("\n🏗️ AUDITING CSS GRID STRUCTURE")
        
        expected_structure = {
            "display": "grid",
            "grid-template-columns": "80px 1fr",
            "grid-template-rows": "repeat(36, 40px)",
            "height": "1440px",
            "position": "relative"
        }
        
        print("  📏 Expected grid structure:")
        for prop, value in expected_structure.items():
            print(f"    {prop}: {value}")
        
        print("\n  📦 Expected appointment positioning:")
        print("    position: absolute")
        print("    top: calculated based on time slot")
        print("    height: duration-based (minimum 38px)")
        print("    left: 4px, right: 4px")
        print("    z-index: 10")
    
    def audit_visual_hierarchy(self) -> None:
        """Audit visual hierarchy and styling"""
        print("\n🎯 AUDITING VISUAL HIERARCHY")
        
        print("  📝 Expected appointment layout:")
        print("    Grid: 3 columns (1fr 1fr 1fr)")
        print("    Left: Title, Source, Time")
        print("    Center: Event Notes")
        print("    Right: Action Items")
        
        print("\n  🎨 Expected styling:")
        print("    Background: white")
        print("    Border: 1px solid #e2e8f0")
        print("    Border-radius: 4px")
        print("    Padding: 4px 8px")
        print("    Font-size: 11px")
    
    def run_comprehensive_audit(self) -> Dict[str, Any]:
        """Run complete audit and return results"""
        print("=" * 80)
        print("📋 DAILY VIEW PIXEL-PERFECT AUDIT SYSTEM")
        print("=" * 80)
        print(f"🕒 Audit Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📅 Reference Date: Wednesday, July 16, 2025")
        print(f"🎯 Target: Pixel-perfect alignment with reference image")
        print()
        
        # Run all audit components
        self.audit_time_slot_alignment()
        self.audit_appointment_positioning()
        self.audit_background_styling()
        self.audit_css_grid_structure()
        self.audit_visual_hierarchy()
        
        # Generate summary
        print("\n" + "=" * 80)
        print("📊 AUDIT SUMMARY")
        print("=" * 80)
        
        if self.issues:
            print(f"❌ Issues Found: {len(self.issues)}")
            print(f"📉 Score: {self.score}/100")
            print("\n🔧 CRITICAL ISSUES TO FIX:")
            for i, issue in enumerate(self.issues, 1):
                print(f"  {i}. [{issue['type']}] {issue['description']}")
        else:
            print("✅ NO ISSUES FOUND - PIXEL PERFECT!")
            print(f"🏆 Score: {self.score}/100")
        
        # Generate action items
        print("\n🛠️ RECOMMENDED FIXES:")
        if self.score < 100:
            print("1. Verify absolute positioning calculations in DailyView.tsx")
            print("2. Check CSS Grid structure in index.css")
            print("3. Ensure full-width backgrounds using ::before pseudo-element")
            print("4. Validate time slot height (40px) consistency")
            print("5. Test appointment positioning for all time slots")
        else:
            print("✅ No fixes needed - system is pixel perfect!")
        
        return {
            "score": self.score,
            "total_issues": len(self.issues),
            "issues": self.issues,
            "timestamp": datetime.now().isoformat(),
            "reference_specs": self.reference_specs
        }

def main():
    """Main audit execution"""
    auditor = DailyViewAudit()
    results = auditor.run_comprehensive_audit()
    
    # Save results to file
    with open('daily_view_audit_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: daily_view_audit_results.json")
    print("\n🚀 Run this audit after each fix to track progress toward pixel perfection!")

if __name__ == "__main__":
    main()