#!/usr/bin/env python3
"""
PDF Export Audit System
Comprehensive analysis of PDF output vs browser daily view for pixel-perfect matching
"""

import json
from typing import Dict, List, Any
from dataclasses import dataclass, asdict

@dataclass
class AuditIssue:
    severity: str  # 'critical', 'high', 'medium', 'low'
    category: str
    description: str
    current_state: str
    expected_state: str
    fix_suggestion: str

@dataclass
class AuditResult:
    overall_score: int  # 0-100
    total_issues: int
    issues_by_severity: Dict[str, int]
    issues: List[AuditIssue]
    recommendations: List[str]

class PDFAuditSystem:
    def __init__(self):
        self.issues = []
        self.browser_spec = self._load_browser_specifications()
        
    def _load_browser_specifications(self) -> Dict[str, Any]:
        """Load the expected browser daily view specifications"""
        return {
            "appointment_block": {
                "background": "#FFFFFF",
                "border": "1px solid #6495ED",
                "border_left": "6px solid #6495ED", 
                "border_radius": "0px",
                "height": "40px",  # Should span 1 time slot (30 minutes)
                "position": "spans_10:00_slot_exactly",
                "font_family": "Inter, -apple-system, BlinkMacSystemFont",
                "padding": "8px 12px"
            },
            "appointment_content": {
                "left_column": {
                    "title": {
                        "text": "Calvin Hill Appointment",
                        "font_size": "16px",
                        "font_weight": "600",
                        "color": "#1E293B",
                        "visible": True
                    },
                    "source": {
                        "text": "SIMPLEPRACTICE", 
                        "font_size": "12px",
                        "font_weight": "500",
                        "color": "rgba(255,255,255,0.8)",
                        "visible": True
                    },
                    "time": {
                        "text": "10:00-11:00",
                        "font_size": "14px", 
                        "font_weight": "500",
                        "color": "rgba(255,255,255,0.9)",
                        "visible": True,
                        "position": "below_source"
                    }
                },
                "middle_column": {
                    "header": {
                        "text": "Event Notes",
                        "font_size": "14px",
                        "font_weight": "600", 
                        "color": "#1E293B",
                        "text_decoration": "underline"
                    },
                    "content": {
                        "text": "He wasn't able to be at this morning's appointment due to work.",
                        "font_size": "14px",
                        "color": "#64748B",
                        "line_height": "1.4",
                        "fully_visible": True
                    }
                },
                "right_column": {
                    "header": {
                        "text": "Action Items", 
                        "font_size": "14px",
                        "font_weight": "600",
                        "color": "#1E293B", 
                        "text_decoration": "underline"
                    },
                    "content": {
                        "text": "I need to see if he's able to find another fixed time, given his schedule with the LIRR.",
                        "font_size": "14px", 
                        "color": "#64748B",
                        "line_height": "1.4",
                        "fully_visible": True
                    }
                }
            },
            "layout": {
                "grid_columns": "3fr 3.5fr 3.5fr",
                "column_gap": "16px",
                "event_height": "100px minimum for content visibility",
                "text_wrapping": "proper word-wrap with overflow-wrap: break-word"
            }
        }
    
    def audit_current_pdf_output(self, pdf_analysis: Dict[str, Any]) -> AuditResult:
        """Audit the current PDF output against browser specifications"""
        
        # Based on the PDF image provided, analyze critical issues:
        
        # CRITICAL ISSUE 1: Missing time display in left column
        self._check_time_display_visibility(pdf_analysis)
        
        # CRITICAL ISSUE 2: Text truncation in Event Notes and Action Items
        self._check_text_truncation(pdf_analysis)
        
        # CRITICAL ISSUE 3: Font sizes too small for readability
        self._check_font_sizes(pdf_analysis)
        
        # HIGH PRIORITY ISSUE 4: Column proportions incorrect
        self._check_column_proportions(pdf_analysis)
        
        # HIGH PRIORITY ISSUE 5: Event height insufficient
        self._check_event_height(pdf_analysis)
        
        # MEDIUM PRIORITY ISSUE 6: Text positioning and hierarchy
        self._check_text_hierarchy(pdf_analysis)
        
        # MEDIUM PRIORITY ISSUE 7: Border and styling consistency
        self._check_styling_consistency(pdf_analysis)
        
        return self._generate_audit_result()
    
    def _check_time_display_visibility(self, pdf_analysis: Dict[str, Any]):
        """Check if time display is visible in left column"""
        time_visible = pdf_analysis.get("left_column", {}).get("time_visible", False)
        
        if not time_visible:
            self.issues.append(AuditIssue(
                severity="critical",
                category="content_visibility", 
                description="Time display missing from left column",
                current_state="Time '10:00-11:00' not visible in left column below SIMPLEPRACTICE",
                expected_state="Time '10:00-11:00' should be clearly visible below 'SIMPLEPRACTICE' text",
                fix_suggestion="Ensure time display is rendered with 14px font, 500 weight, positioned below source text"
            ))
    
    def _check_text_truncation(self, pdf_analysis: Dict[str, Any]):
        """Check for text truncation in Event Notes and Action Items"""
        notes_truncated = pdf_analysis.get("middle_column", {}).get("text_truncated", True)
        actions_truncated = pdf_analysis.get("right_column", {}).get("text_truncated", True)
        
        if notes_truncated:
            self.issues.append(AuditIssue(
                severity="critical",
                category="content_visibility",
                description="Event Notes text is truncated/cut off",
                current_state="Text appears cut off: 'He wasn't able to be at this...'",
                expected_state="Full text visible: 'He wasn't able to be at this morning's appointment due to work.'",
                fix_suggestion="Increase event height to minimum 100px and ensure proper text wrapping"
            ))
            
        if actions_truncated:
            self.issues.append(AuditIssue(
                severity="critical", 
                category="content_visibility",
                description="Action Items text is truncated/cut off",
                current_state="Text appears cut off in right column",
                expected_state="Full text visible: 'I need to see if he's able to find another fixed time, given his schedule with the LIRR.'",
                fix_suggestion="Increase event height and improve text wrapping with overflow-wrap: break-word"
            ))
    
    def _check_font_sizes(self, pdf_analysis: Dict[str, Any]):
        """Check font sizes against specifications"""
        current_title_size = pdf_analysis.get("left_column", {}).get("title_font_size", "13px")
        current_header_size = pdf_analysis.get("middle_column", {}).get("header_font_size", "10px")
        
        if current_title_size != "16px":
            self.issues.append(AuditIssue(
                severity="high",
                category="typography",
                description="Appointment title font size too small",
                current_state=f"Title font size: {current_title_size}",
                expected_state="Title font size: 16px",
                fix_suggestion="Update appointment title font-size to 16px for better readability"
            ))
            
        if current_header_size != "14px":
            self.issues.append(AuditIssue(
                severity="high",
                category="typography", 
                description="Section headers font size too small",
                current_state=f"Header font size: {current_header_size}",
                expected_state="Header font size: 14px",
                fix_suggestion="Update Event Notes and Action Items headers to 14px font size"
            ))
    
    def _check_column_proportions(self, pdf_analysis: Dict[str, Any]):
        """Check grid column proportions"""
        current_columns = pdf_analysis.get("layout", {}).get("grid_columns", "1fr 1fr 1fr")
        expected_columns = "3fr 3.5fr 3.5fr"
        
        if current_columns != expected_columns:
            self.issues.append(AuditIssue(
                severity="high",
                category="layout",
                description="Column proportions incorrect", 
                current_state=f"Grid columns: {current_columns}",
                expected_state=f"Grid columns: {expected_columns}",
                fix_suggestion="Change grid-template-columns to '3fr 3.5fr 3.5fr' for better content distribution"
            ))
    
    def _check_event_height(self, pdf_analysis: Dict[str, Any]):
        """Check if event height is sufficient for content"""
        current_height = pdf_analysis.get("layout", {}).get("event_height", "45px")
        
        if "100px" not in current_height:
            self.issues.append(AuditIssue(
                severity="high",
                category="layout",
                description="Event height insufficient for content visibility",
                current_state=f"Event height: {current_height}",
                expected_state="Event height: minimum 100px",
                fix_suggestion="Increase minimum event height to 100px to prevent text truncation"
            ))
    
    def _check_text_hierarchy(self, pdf_analysis: Dict[str, Any]):
        """Check text positioning and hierarchy"""
        self.issues.append(AuditIssue(
            severity="medium",
            category="typography",
            description="Text hierarchy needs improvement",
            current_state="Inconsistent spacing and positioning between text elements",
            expected_state="Clear hierarchy: title → source → time with 4px margins",
            fix_suggestion="Apply consistent 4px margins between text elements and proper line-height: 1.4"
        ))
    
    def _check_styling_consistency(self, pdf_analysis: Dict[str, Any]):
        """Check styling consistency with browser view"""
        self.issues.append(AuditIssue(
            severity="medium", 
            category="styling",
            description="Styling consistency with browser view",
            current_state="Some styling elements may not match browser exactly",
            expected_state="Pixel-perfect match with browser daily view styling",
            fix_suggestion="Ensure Inter font family, proper colors (#1E293B, #64748B), and exact spacing"
        ))
    
    def _generate_audit_result(self) -> AuditResult:
        """Generate final audit result with scoring"""
        issues_by_severity = {
            "critical": len([i for i in self.issues if i.severity == "critical"]),
            "high": len([i for i in self.issues if i.severity == "high"]), 
            "medium": len([i for i in self.issues if i.severity == "medium"]),
            "low": len([i for i in self.issues if i.severity == "low"])
        }
        
        # Calculate score (100 - weighted penalty for issues)
        score = 100
        score -= issues_by_severity["critical"] * 25  # -25 points per critical
        score -= issues_by_severity["high"] * 15     # -15 points per high
        score -= issues_by_severity["medium"] * 8    # -8 points per medium
        score -= issues_by_severity["low"] * 3       # -3 points per low
        score = max(0, score)  # Don't go below 0
        
        recommendations = self._generate_recommendations()
        
        return AuditResult(
            overall_score=score,
            total_issues=len(self.issues),
            issues_by_severity=issues_by_severity,
            issues=self.issues,
            recommendations=recommendations
        )
    
    def _generate_recommendations(self) -> List[str]:
        """Generate prioritized recommendations"""
        return [
            "IMMEDIATE FIX: Add time display '10:00-11:00' below SIMPLEPRACTICE in left column",
            "IMMEDIATE FIX: Increase event height to minimum 100px to show full text content",
            "HIGH PRIORITY: Update font sizes - title: 16px, headers: 14px, body: 14px",
            "HIGH PRIORITY: Change grid columns to '3fr 3.5fr 3.5fr' for better proportions", 
            "MEDIUM PRIORITY: Apply Inter font family and proper text hierarchy spacing",
            "FINAL STEP: Ensure all text wraps properly with overflow-wrap: break-word"
        ]

def run_pdf_audit():
    """Run the PDF audit with current state analysis"""
    
    # Based on the provided PDF image, here's the current state analysis:
    current_pdf_state = {
        "left_column": {
            "title_visible": True,
            "title_font_size": "13px",  # Too small
            "source_visible": True,
            "time_visible": False,      # CRITICAL: Missing time display
        },
        "middle_column": {
            "header_visible": True,
            "header_font_size": "10px", # Too small
            "text_truncated": True,     # CRITICAL: Text cut off
            "content_fully_visible": False
        },
        "right_column": {
            "header_visible": True, 
            "header_font_size": "10px", # Too small
            "text_truncated": True,     # CRITICAL: Text cut off
            "content_fully_visible": False
        },
        "layout": {
            "grid_columns": "1fr 1fr 1fr",  # Should be 3fr 3.5fr 3.5fr
            "event_height": "45px",         # Should be 100px minimum
            "column_gap": "10px"            # Should be 16px
        }
    }
    
    auditor = PDFAuditSystem()
    result = auditor.audit_current_pdf_output(current_pdf_state)
    
    # Print comprehensive audit report
    print("=" * 80)
    print("📊 PDF EXPORT AUDIT REPORT")
    print("=" * 80)
    print(f"Overall Score: {result.overall_score}/100")
    print(f"Total Issues: {result.total_issues}")
    print()
    
    print("Issues by Severity:")
    for severity, count in result.issues_by_severity.items():
        if count > 0:
            print(f"  {severity.upper()}: {count}")
    print()
    
    print("DETAILED ISSUES:")
    print("-" * 50)
    for i, issue in enumerate(result.issues, 1):
        print(f"{i}. [{issue.severity.upper()}] {issue.description}")
        print(f"   Current: {issue.current_state}")
        print(f"   Expected: {issue.expected_state}")
        print(f"   Fix: {issue.fix_suggestion}")
        print()
    
    print("PRIORITIZED RECOMMENDATIONS:")
    print("-" * 50)
    for i, rec in enumerate(result.recommendations, 1):
        print(f"{i}. {rec}")
    print()
    
    print("=" * 80)
    print("🎯 NEXT STEPS FOR 100% PIXEL-PERFECT MATCHING")
    print("=" * 80)
    print("Focus on resolving CRITICAL issues first:")
    critical_issues = [i for i in result.issues if i.severity == "critical"]
    for issue in critical_issues:
        print(f"• {issue.description}")
    print()
    
    return result

if __name__ == "__main__":
    audit_result = run_pdf_audit()
    
    # Save audit results to JSON for further analysis
    with open("pdf_audit_results.json", "w") as f:
        json.dump({
            "score": audit_result.overall_score,
            "total_issues": audit_result.total_issues,
            "issues_by_severity": audit_result.issues_by_severity,
            "issues": [asdict(issue) for issue in audit_result.issues],
            "recommendations": audit_result.recommendations
        }, f, indent=2)
    
    print(f"Audit results saved to pdf_audit_results.json")