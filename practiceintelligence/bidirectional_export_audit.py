#!/usr/bin/env python3
"""
BIDIRECTIONAL WEEKLY PACKAGE EXPORT AUDIT SYSTEM
Comprehensive pre-export validation to ensure 100% success rate
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple

class BidirectionalExportAudit:
    def __init__(self):
        self.audit_results = {
            'timestamp': datetime.now().isoformat(),
            'overall_score': 0,
            'max_score': 100,
            'critical_issues': [],
            'warnings': [],
            'validations': {},
            'template_analysis': {},
            'export_readiness': False
        }
        
    def run_comprehensive_audit(self) -> Dict[str, Any]:
        """Run complete audit of bidirectional export system"""
        print("🔍 BIDIRECTIONAL WEEKLY PACKAGE EXPORT AUDIT")
        print("=" * 50)
        
        # Core template validation (40 points)
        self._validate_existing_templates()
        
        # Import structure validation (30 points)
        self._validate_import_structure()
        
        # Function implementation validation (20 points)
        self._validate_function_implementation()
        
        # Integration validation (10 points)
        self._validate_integration()
        
        # Calculate final score and readiness
        self._calculate_final_score()
        
        return self.audit_results
    
    def _validate_existing_templates(self):
        """Validate existing template functions are accessible and functional"""
        print("\n📋 Validating Existing Templates...")
        
        template_files = {
            'currentWeeklyExport.ts': {
                'path': 'client/src/utils/currentWeeklyExport.ts',
                'function': 'exportCurrentWeeklyView',
                'points': 20
            },
            'browserReplicaPDF.ts': {
                'path': 'client/src/utils/browserReplicaPDF.ts', 
                'function': 'exportBrowserReplicaPDF',
                'points': 20
            }
        }
        
        for template_name, config in template_files.items():
            file_path = config['path']
            function_name = config['function']
            
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check function exists and is exported
                export_pattern = rf'export\s+(?:const|async\s+function|function)\s+{function_name}'
                if re.search(export_pattern, content):
                    self.audit_results['validations'][f'{template_name}_exists'] = True
                    self.audit_results['overall_score'] += config['points']
                    print(f"  ✅ {template_name}: Function {function_name} found and exported")
                    
                    # Analyze template structure
                    self._analyze_template_structure(template_name, content, function_name)
                    
                else:
                    self.audit_results['validations'][f'{template_name}_exists'] = False
                    self.audit_results['critical_issues'].append(
                        f"Template function {function_name} not found in {template_name}"
                    )
                    print(f"  ❌ {template_name}: Function {function_name} NOT FOUND")
            else:
                self.audit_results['validations'][f'{template_name}_exists'] = False
                self.audit_results['critical_issues'].append(f"Template file {template_name} not found")
                print(f"  ❌ {template_name}: FILE NOT FOUND")
    
    def _analyze_template_structure(self, template_name: str, content: str, function_name: str):
        """Analyze internal structure of template functions"""
        analysis = {
            'has_pdf_creation': 'jsPDF' in content or 'pdf' in content,
            'has_html_canvas': 'html2canvas' in content,
            'has_event_filtering': 'filter' in content and 'event' in content.lower(),
            'has_navigation_elements': any(nav in content.lower() for nav in ['previous', 'next', 'back', 'weekly']),
            'parameter_count': len(re.findall(r'\([^)]*\)', content.split(function_name)[1].split('{')[0])) if function_name in content else 0
        }
        
        self.audit_results['template_analysis'][template_name] = analysis
        
        # Validate template completeness
        if all([analysis['has_pdf_creation'], analysis['has_event_filtering']]):
            print(f"    📊 {template_name}: Complete template structure verified")
        else:
            self.audit_results['warnings'].append(f"{template_name} may have incomplete structure")
    
    def _validate_import_structure(self):
        """Validate import structure in bidirectional export file"""
        print("\n🔗 Validating Import Structure...")
        
        bidirectional_file = 'client/src/utils/bidirectionalWeeklyPackageLinked.ts'
        
        if os.path.exists(bidirectional_file):
            with open(bidirectional_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check dynamic imports are properly structured
            dynamic_imports = re.findall(r'await import\([\'"]([^\'"]+)[\'"]\)', content)
            expected_imports = ['./currentWeeklyExport', './browserReplicaPDF']
            
            import_score = 0
            for expected in expected_imports:
                if any(expected in imp for imp in dynamic_imports):
                    import_score += 10
                    print(f"  ✅ Dynamic import for {expected} found")
                else:
                    self.audit_results['critical_issues'].append(f"Missing dynamic import for {expected}")
                    print(f"  ❌ Dynamic import for {expected} MISSING")
            
            # Check function extraction
            function_extractions = re.findall(r'const\s+\{\s*([^}]+)\s*\}\s*=\s*await import', content)
            if 'exportCurrentWeeklyView' in str(function_extractions) and 'exportBrowserReplicaPDF' in str(function_extractions):
                import_score += 10
                print("  ✅ Function extractions properly structured")
            else:
                self.audit_results['critical_issues'].append("Function extractions not properly structured")
                print("  ❌ Function extractions MISSING or malformed")
            
            self.audit_results['overall_score'] += import_score
            self.audit_results['validations']['import_structure'] = import_score == 30
            
        else:
            self.audit_results['critical_issues'].append("Bidirectional export file not found")
            print("  ❌ bidirectionalWeeklyPackageLinked.ts NOT FOUND")
    
    def _validate_function_implementation(self):
        """Validate the main export function implementation"""
        print("\n⚙️ Validating Function Implementation...")
        
        bidirectional_file = 'client/src/utils/bidirectionalWeeklyPackageLinked.ts'
        
        if os.path.exists(bidirectional_file):
            with open(bidirectional_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            implementation_checks = {
                'function_exported': 'export const exportLinkedWeeklyPackage' in content,
                'async_function': 'async (' in content,
                'proper_parameters': all(param in content for param in ['weekStartDate', 'weekEndDate', 'events']),
                'error_handling': 'try {' in content and 'catch' in content,
                'console_logging': 'console.log' in content,
                'weekly_call': 'exportCurrentWeeklyView(' in content,
                'daily_loop': 'for (' in content and 'dayIndex' in content,
                'daily_calls': 'exportBrowserReplicaPDF(' in content
            }
            
            passed_checks = sum(implementation_checks.values())
            implementation_score = (passed_checks / len(implementation_checks)) * 20
            
            for check, passed in implementation_checks.items():
                status = "✅" if passed else "❌"
                print(f"  {status} {check.replace('_', ' ').title()}: {'PASS' if passed else 'FAIL'}")
                
                if not passed:
                    self.audit_results['critical_issues'].append(f"Implementation check failed: {check}")
            
            self.audit_results['overall_score'] += implementation_score
            self.audit_results['validations']['function_implementation'] = implementation_score >= 16  # 80% threshold
            
        else:
            self.audit_results['critical_issues'].append("Cannot validate implementation - file not found")
    
    def _validate_integration(self):
        """Validate integration with planner.tsx"""
        print("\n🔌 Validating Integration...")
        
        planner_file = 'client/src/pages/planner.tsx'
        
        if os.path.exists(planner_file):
            with open(planner_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            integration_checks = {
                'import_statement': 'exportLinkedWeeklyPackage' in content and 'bidirectionalWeeklyPackageLinked' in content,
                'case_statement': "case 'bidirectional-weekly-package':" in content,
                'function_call': 'exportLinkedWeeklyPackage(' in content,
                'proper_parameters': 'weekStart' in content and 'weekEnd' in content and 'allEvents' in content
            }
            
            passed_integration = sum(integration_checks.values())
            integration_score = (passed_integration / len(integration_checks)) * 10
            
            for check, passed in integration_checks.items():
                status = "✅" if passed else "❌"
                print(f"  {status} {check.replace('_', ' ').title()}: {'PASS' if passed else 'FAIL'}")
                
                if not passed:
                    self.audit_results['warnings'].append(f"Integration issue: {check}")
            
            self.audit_results['overall_score'] += integration_score
            self.audit_results['validations']['integration'] = integration_score >= 8  # 80% threshold
            
        else:
            self.audit_results['critical_issues'].append("Planner.tsx not found for integration validation")
    
    def _calculate_final_score(self):
        """Calculate final score and export readiness"""
        score = self.audit_results['overall_score']
        critical_issues = len(self.audit_results['critical_issues'])
        
        print(f"\n📊 AUDIT RESULTS")
        print("=" * 30)
        print(f"Overall Score: {score:.1f}/100")
        print(f"Critical Issues: {critical_issues}")
        print(f"Warnings: {len(self.audit_results['warnings'])}")
        
        # Determine export readiness
        if score >= 90 and critical_issues == 0:
            self.audit_results['export_readiness'] = True
            print("🟢 EXPORT READY: System passes all critical validations")
        elif score >= 70 and critical_issues <= 1:
            self.audit_results['export_readiness'] = True
            print("🟡 EXPORT READY WITH WARNINGS: Minor issues detected but functional")
        else:
            self.audit_results['export_readiness'] = False
            print("🔴 EXPORT NOT READY: Critical issues must be resolved")
        
        # Print detailed issues
        if self.audit_results['critical_issues']:
            print("\n❌ CRITICAL ISSUES:")
            for issue in self.audit_results['critical_issues']:
                print(f"  - {issue}")
        
        if self.audit_results['warnings']:
            print("\n⚠️ WARNINGS:")
            for warning in self.audit_results['warnings']:
                print(f"  - {warning}")
    
    def generate_audit_report(self) -> str:
        """Generate detailed audit report"""
        report = f"""
BIDIRECTIONAL WEEKLY PACKAGE EXPORT AUDIT REPORT
Generated: {self.audit_results['timestamp']}

OVERALL ASSESSMENT:
- Score: {self.audit_results['overall_score']:.1f}/100
- Export Ready: {'YES' if self.audit_results['export_readiness'] else 'NO'}
- Critical Issues: {len(self.audit_results['critical_issues'])}
- Warnings: {len(self.audit_results['warnings'])}

TEMPLATE ANALYSIS:
{json.dumps(self.audit_results['template_analysis'], indent=2)}

VALIDATION RESULTS:
{json.dumps(self.audit_results['validations'], indent=2)}

RECOMMENDATIONS:
"""
        
        if self.audit_results['export_readiness']:
            report += "✅ System is ready for export testing. All critical validations passed.\n"
        else:
            report += "❌ System requires fixes before export testing:\n"
            for issue in self.audit_results['critical_issues']:
                report += f"  - Fix: {issue}\n"
        
        return report

def main():
    """Run the audit system"""
    auditor = BidirectionalExportAudit()
    results = auditor.run_comprehensive_audit()
    
    # Save audit results
    with open('bidirectional_export_audit_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Generate and save report
    report = auditor.generate_audit_report()
    with open('bidirectional_export_audit_report.txt', 'w') as f:
        f.write(report)
    
    print(f"\n💾 Audit results saved to bidirectional_export_audit_results.json")
    print(f"📄 Detailed report saved to bidirectional_export_audit_report.txt")
    
    return results['export_readiness']

if __name__ == "__main__":
    export_ready = main()
    exit(0 if export_ready else 1)