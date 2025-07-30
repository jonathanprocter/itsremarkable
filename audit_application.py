#!/usr/bin/env python3
"""
Comprehensive Application Audit Script
Analyzes the entire codebase for authentication issues, silent failures, 
disconnected components, and unnecessary code causing problems.
"""

import os
import re
import json
import ast
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict

class ApplicationAuditor:
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.issues = defaultdict(list)
        self.warnings = defaultdict(list)
        self.auth_flow_map = {}
        self.api_endpoints = set()
        self.frontend_api_calls = set()
        self.duplicate_code = defaultdict(list)
        self.silent_failures = []
        
    def audit_authentication_flow(self):
        """Audit the authentication flow for inconsistencies"""
        print("🔍 Auditing authentication flow...")
        
        # Find all authentication-related files
        auth_files = []
        for file_path in self.root_dir.rglob("*"):
            if file_path.is_file() and any(auth_term in file_path.name.lower() 
                                         for auth_term in ['auth', 'oauth', 'session', 'passport']):
                auth_files.append(file_path)
        
        # Analyze authentication endpoints
        server_auth_endpoints = self._find_auth_endpoints()
        client_auth_calls = self._find_client_auth_calls()
        
        # Check for mismatched endpoints
        self._check_endpoint_mismatch(server_auth_endpoints, client_auth_calls)
        
        # Check for duplicate authentication systems
        self._check_duplicate_auth_systems()
        
        # Check session handling
        self._check_session_handling()
        
        return {
            'auth_files': len(auth_files),
            'server_endpoints': len(server_auth_endpoints),
            'client_calls': len(client_auth_calls),
            'issues_found': len(self.issues['auth'])
        }
    
    def _find_auth_endpoints(self) -> Set[str]:
        """Find all authentication endpoints in server files"""
        endpoints = set()
        
        server_files = list(self.root_dir.glob("server/**/*.ts")) + list(self.root_dir.glob("server/**/*.js"))
        
        for file_path in server_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find Express routes
                route_patterns = [
                    r"app\.(get|post|put|delete)\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"router\.(get|post|put|delete)\s*\(\s*['\"]([^'\"]+)['\"]"
                ]
                
                for pattern in route_patterns:
                    matches = re.findall(pattern, content)
                    for method, route in matches:
                        if 'auth' in route.lower():
                            endpoints.add(f"{method.upper()} {route}")
                            
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        return endpoints
    
    def _find_client_auth_calls(self) -> Set[str]:
        """Find all authentication API calls in client files"""
        calls = set()
        
        client_files = list(self.root_dir.glob("client/**/*.ts")) + \
                      list(self.root_dir.glob("client/**/*.tsx")) + \
                      list(self.root_dir.glob("client/**/*.js"))
        
        for file_path in client_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find fetch calls to auth endpoints
                fetch_patterns = [
                    r"fetch\s*\(\s*['\"]([^'\"]*auth[^'\"]*)['\"]",
                    r"apiRequest\s*\(\s*['\"]([^'\"]*auth[^'\"]*)['\"]"
                ]
                
                for pattern in fetch_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        calls.add(match)
                        
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        return calls
    
    def _check_endpoint_mismatch(self, server_endpoints: Set[str], client_calls: Set[str]):
        """Check for mismatched endpoints between server and client"""
        server_routes = {ep.split(' ', 1)[1] for ep in server_endpoints}
        
        for call in client_calls:
            if call not in server_routes:
                self.issues['auth'].append(f"Client calls non-existent endpoint: {call}")
    
    def _check_duplicate_auth_systems(self):
        """Check for duplicate or conflicting authentication systems"""
        auth_imports = defaultdict(list)
        auth_strategies = defaultdict(list)
        
        # Look for passport strategies and auth imports
        server_files = list(self.root_dir.glob("server/**/*.ts")) + list(self.root_dir.glob("server/**/*.js"))
        
        for file_path in server_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Check for passport strategy definitions
                if 'passport.use' in content:
                    strategy_matches = re.findall(r'passport\.use\s*\(\s*new\s+(\w+)', content)
                    for strategy in strategy_matches:
                        auth_strategies[strategy].append(str(file_path))
                
                # Check for auth-related imports
                import_matches = re.findall(r'import.*from.*[\'\"](.*auth.*)[\'\"]\s*;?', content)
                for import_path in import_matches:
                    auth_imports[import_path].append(str(file_path))
                    
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        # Report duplicates
        for strategy, files in auth_strategies.items():
            if len(files) > 1:
                self.issues['auth'].append(f"Duplicate {strategy} strategy in: {', '.join(files)}")
        
        for import_path, files in auth_imports.items():
            if len(files) > 3:  # More than 3 files importing same auth module is suspicious
                self.warnings['auth'].append(f"Auth module {import_path} imported in {len(files)} files")
    
    def _check_session_handling(self):
        """Check for session handling inconsistencies"""
        session_configs = []
        
        server_files = list(self.root_dir.glob("server/**/*.ts")) + list(self.root_dir.glob("server/**/*.js"))
        
        for file_path in server_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Look for session configuration
                if 'session(' in content:
                    # Extract session config
                    session_pattern = r'session\s*\(\s*\{([^}]+)\}'
                    matches = re.findall(session_pattern, content, re.DOTALL)
                    if matches:
                        session_configs.append((str(file_path), matches[0]))
                
                # Check for session access patterns
                session_access_patterns = [
                    r'req\.session\.(\w+)',
                    r'req\.user',
                    r'req\.isAuthenticated\(\)'
                ]
                
                for pattern in session_access_patterns:
                    matches = re.findall(pattern, content)
                    if matches:
                        # Check if there's proper error handling
                        if 'req.session' in content and 'req.session &&' not in content:
                            self.warnings['session'].append(f"Unsafe session access in {file_path}")
                            
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        if len(session_configs) > 1:
            self.issues['session'].append(f"Multiple session configurations found in {len(session_configs)} files")
    
    def audit_silent_failures(self):
        """Audit for silent failures and missing error handling"""
        print("🔍 Auditing for silent failures...")
        
        all_files = list(self.root_dir.glob("**/*.ts")) + \
                   list(self.root_dir.glob("**/*.tsx")) + \
                   list(self.root_dir.glob("**/*.js"))
        
        for file_path in all_files:
            if 'node_modules' in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                self._check_async_without_await(content, file_path)
                self._check_fetch_without_error_handling(content, file_path)
                self._check_promise_without_catch(content, file_path)
                self._check_console_errors_ignored(content, file_path)
                
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
    
    def _check_async_without_await(self, content: str, file_path: Path):
        """Check for async functions without proper await usage"""
        # Find async functions
        async_functions = re.findall(r'async\s+function\s+(\w+)', content)
        async_arrows = re.findall(r'(\w+)\s*=\s*async\s*\(', content)
        
        all_async = async_functions + async_arrows
        
        for func_name in all_async:
            # Check if function has awaits
            func_pattern = rf'(async\s+(function\s+{func_name}|{func_name}\s*=).*?)(?=\n\s*\w+|$)'
            func_match = re.search(func_pattern, content, re.DOTALL)
            
            if func_match and 'await' not in func_match.group(1):
                self.warnings['async'].append(f"Async function {func_name} in {file_path} has no await")
    
    def _check_fetch_without_error_handling(self, content: str, file_path: Path):
        """Check for fetch calls without proper error handling"""
        fetch_calls = re.findall(r'fetch\s*\([^)]+\)', content)
        
        for i, fetch_call in enumerate(fetch_calls):
            # Look for error handling in the surrounding context
            start_pos = content.find(fetch_call)
            end_pos = start_pos + 500  # Check next 500 characters
            context = content[start_pos:end_pos]
            
            if not any(error_pattern in context.lower() for error_pattern in 
                      ['catch', 'error', '.ok', 'status']):
                self.silent_failures.append(f"Fetch without error handling in {file_path}: {fetch_call[:50]}...")
    
    def _check_promise_without_catch(self, content: str, file_path: Path):
        """Check for promises without catch blocks"""
        promise_patterns = [
            r'\.then\s*\([^)]+\)(?!\s*\.catch)',
            r'new\s+Promise\s*\([^)]+\)'
        ]
        
        for pattern in promise_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                # Check if there's a catch within the next 200 characters
                end_pos = match.end() + 200
                context = content[match.start():end_pos]
                
                if '.catch' not in context:
                    self.silent_failures.append(f"Promise without catch in {file_path} at position {match.start()}")
    
    def _check_console_errors_ignored(self, content: str, file_path: Path):
        """Check for console.error calls that might indicate ignored errors"""
        console_errors = re.findall(r'console\.error\s*\([^)]+\)', content)
        
        if len(console_errors) > 5:  # More than 5 console.error calls might indicate poor error handling
            self.warnings['error_handling'].append(f"Many console.error calls in {file_path}: {len(console_errors)}")
    
    def audit_code_quality(self):
        """Audit overall code quality issues"""
        print("🔍 Auditing code quality...")
        
        # Find duplicate code blocks
        self._find_duplicate_code()
        
        # Find unused imports/exports
        self._find_unused_imports()
        
        # Find overly complex files
        self._find_complex_files()
    
    def _find_duplicate_code(self):
        """Find duplicate code blocks that might cause issues"""
        code_blocks = defaultdict(list)
        
        all_files = list(self.root_dir.glob("**/*.ts")) + \
                   list(self.root_dir.glob("**/*.tsx")) + \
                   list(self.root_dir.glob("**/*.js"))
        
        for file_path in all_files:
            if 'node_modules' in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                # Look for function definitions
                for i, line in enumerate(lines):
                    if re.match(r'\s*(export\s+)?(async\s+)?function\s+\w+', line):
                        # Get next 10 lines as a block
                        block = '\n'.join(lines[i:i+10])
                        normalized_block = re.sub(r'\s+', ' ', block).strip()
                        
                        if len(normalized_block) > 50:  # Only consider substantial blocks
                            code_blocks[normalized_block].append((str(file_path), i+1))
                            
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        # Report duplicates
        for block, locations in code_blocks.items():
            if len(locations) > 1:
                self.duplicate_code[block[:100] + "..."] = locations
    
    def _find_unused_imports(self):
        """Find potentially unused imports"""
        import_usage = defaultdict(list)
        
        ts_files = list(self.root_dir.glob("**/*.ts")) + list(self.root_dir.glob("**/*.tsx"))
        
        for file_path in ts_files:
            if 'node_modules' in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find imports
                import_matches = re.findall(r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]', content)
                
                for imports, module in import_matches:
                    imported_items = [item.strip() for item in imports.split(',')]
                    
                    for item in imported_items:
                        # Check if item is used in the file
                        if item not in content.replace(f'import {{ {imports} }}', ''):
                            import_usage[str(file_path)].append(f"Unused import: {item} from {module}")
                            
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        # Add to warnings if there are many unused imports
        for file_path, unused in import_usage.items():
            if len(unused) > 3:
                self.warnings['imports'].append(f"Many unused imports in {file_path}: {len(unused)}")
    
    def _find_complex_files(self):
        """Find overly complex files that might cause issues"""
        
        all_files = list(self.root_dir.glob("**/*.ts")) + \
                   list(self.root_dir.glob("**/*.tsx")) + \
                   list(self.root_dir.glob("**/*.js"))
        
        for file_path in all_files:
            if 'node_modules' in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                # Count various complexity metrics
                function_count = len(re.findall(r'function\s+\w+', content))
                class_count = len(re.findall(r'class\s+\w+', content))
                import_count = len(re.findall(r'^import\s+', content, re.MULTILINE))
                line_count = len(lines)
                
                complexity_score = function_count * 2 + class_count * 3 + import_count + line_count / 100
                
                if complexity_score > 50:  # Arbitrary threshold
                    self.warnings['complexity'].append(
                        f"High complexity in {file_path}: {complexity_score:.1f} "
                        f"({function_count} functions, {class_count} classes, {line_count} lines)"
                    )
                    
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
    
    def audit_api_consistency(self):
        """Audit API endpoint consistency between frontend and backend"""
        print("🔍 Auditing API consistency...")
        
        # Find all API endpoints defined in backend
        backend_endpoints = self._find_all_backend_endpoints()
        
        # Find all API calls made by frontend
        frontend_calls = self._find_all_frontend_api_calls()
        
        # Check for mismatches
        self._check_api_mismatches(backend_endpoints, frontend_calls)
        
        return {
            'backend_endpoints': len(backend_endpoints),
            'frontend_calls': len(frontend_calls),
            'issues_found': len(self.issues['api'])
        }
    
    def _find_all_backend_endpoints(self) -> Set[str]:
        """Find all API endpoints in backend"""
        endpoints = set()
        
        server_files = list(self.root_dir.glob("server/**/*.ts")) + list(self.root_dir.glob("server/**/*.js"))
        
        for file_path in server_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find Express routes
                route_patterns = [
                    r"app\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"router\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]"
                ]
                
                for pattern in route_patterns:
                    matches = re.findall(pattern, content)
                    for method, route in matches:
                        endpoints.add(f"{method.upper()} {route}")
                        
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        return endpoints
    
    def _find_all_frontend_api_calls(self) -> Set[str]:
        """Find all API calls in frontend"""
        calls = set()
        
        client_files = list(self.root_dir.glob("client/**/*.ts")) + \
                      list(self.root_dir.glob("client/**/*.tsx")) + \
                      list(self.root_dir.glob("client/**/*.js"))
        
        for file_path in client_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find fetch calls
                fetch_patterns = [
                    r"fetch\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"apiRequest\s*\(\s*['\"]([^'\"]+)['\"]"
                ]
                
                for pattern in fetch_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        if match.startswith('/api/'):
                            calls.add(match)
                            
            except Exception as e:
                self.warnings['file_read'].append(f"Could not read {file_path}: {e}")
        
        return calls
    
    def _check_api_mismatches(self, backend_endpoints: Set[str], frontend_calls: Set[str]):
        """Check for API mismatches"""
        backend_routes = {ep.split(' ', 1)[1] for ep in backend_endpoints if ' ' in ep}
        
        # Find frontend calls to non-existent endpoints
        for call in frontend_calls:
            if call not in backend_routes:
                self.issues['api'].append(f"Frontend calls non-existent endpoint: {call}")
        
        # Find unused backend endpoints
        for route in backend_routes:
            if route not in frontend_calls and '/api/' in route:
                self.warnings['api'].append(f"Unused backend endpoint: {route}")
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive audit report"""
        print("\n📊 Generating audit report...")
        
        report = {
            'summary': {
                'total_issues': sum(len(issues) for issues in self.issues.values()),
                'total_warnings': sum(len(warnings) for warnings in self.warnings.values()),
                'silent_failures': len(self.silent_failures),
                'duplicate_code_blocks': len(self.duplicate_code)
            },
            'issues': dict(self.issues),
            'warnings': dict(self.warnings),
            'silent_failures': self.silent_failures,
            'duplicate_code': dict(self.duplicate_code),
            'recommendations': self._generate_recommendations()
        }
        
        return report
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on audit findings"""
        recommendations = []
        
        # Authentication recommendations
        if self.issues['auth']:
            recommendations.append("Fix authentication flow inconsistencies")
            recommendations.append("Consolidate duplicate authentication systems")
        
        # Session recommendations  
        if self.issues['session']:
            recommendations.append("Fix session handling inconsistencies")
            recommendations.append("Add proper session error handling")
        
        # Silent failure recommendations
        if len(self.silent_failures) > 10:
            recommendations.append("Add comprehensive error handling for fetch calls and promises")
        
        # API consistency recommendations
        if self.issues['api']:
            recommendations.append("Fix API endpoint mismatches between frontend and backend")
        
        # Code quality recommendations
        if len(self.duplicate_code) > 5:
            recommendations.append("Refactor duplicate code into reusable functions")
        
        if self.warnings['complexity']:
            recommendations.append("Break down complex files into smaller modules")
        
        return recommendations

def main():
    """Main audit function"""
    print("🚀 Starting comprehensive application audit...")
    
    auditor = ApplicationAuditor()
    
    # Run all audits
    auth_results = auditor.audit_authentication_flow()
    auditor.audit_silent_failures()
    auditor.audit_code_quality()
    api_results = auditor.audit_api_consistency()
    
    # Generate report
    report = auditor.generate_report()
    
    # Print summary
    print("\n" + "="*50)
    print("📋 AUDIT SUMMARY")
    print("="*50)
    print(f"Total Issues: {report['summary']['total_issues']}")
    print(f"Total Warnings: {report['summary']['total_warnings']}")
    print(f"Silent Failures: {report['summary']['silent_failures']}")
    print(f"Duplicate Code Blocks: {report['summary']['duplicate_code_blocks']}")
    
    print(f"\nAuthentication Flow: {auth_results['issues_found']} issues found")
    print(f"API Consistency: {api_results['issues_found']} issues found")
    
    # Print critical issues
    if report['issues']:
        print("\n🚨 CRITICAL ISSUES:")
        for category, issues in report['issues'].items():
            if issues:
                print(f"\n{category.upper()}:")
                for issue in issues[:5]:  # Show first 5 issues
                    print(f"  • {issue}")
                if len(issues) > 5:
                    print(f"  ... and {len(issues) - 5} more")
    
    # Print recommendations
    if report['recommendations']:
        print("\n💡 RECOMMENDATIONS:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"{i}. {rec}")
    
    # Save detailed report
    with open('audit_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: audit_report.json")
    
    return report

if __name__ == "__main__":
    main()