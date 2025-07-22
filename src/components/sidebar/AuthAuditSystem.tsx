import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AuditResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  fix?: string;
}

interface ComprehensiveAudit {
  timestamp: string;
  results: AuditResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
}

export function AuthAuditSystem() {
  const [auditResults, setAuditResults] = useState<ComprehensiveAudit | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const runComprehensiveAudit = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/audit/comprehensive');
      const data = await response.json();
      
      if (response.ok) {
        setAuditResults(data);
        // Audit results received
        toast({
          title: "Audit Complete",
          description: `Found ${data.summary.failed} issues, ${data.summary.warnings} warnings`,
        });
      } else {
        throw new Error(data.error || 'Audit failed');
      }
    } catch (error) {
      // Audit error occurred
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAutoFix = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/audit/autofix', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Auto-Fix Complete",
          description: `Applied ${data.fixes.length} fixes`,
        });
        // Re-run audit after fixes
        await runComprehensiveAudit();
      } else {
        throw new Error(data.error || 'Auto-fix failed');
      }
    } catch (error) {
      toast({
        title: "Auto-Fix Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full mt-4 p-4 border rounded-lg bg-white">
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Authentication Audit System
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Comprehensive authentication and system health diagnostics
      </p>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runComprehensiveAudit}
            disabled={isRunning}
            variant="outline"
            className="flex-1"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
          
          <Button 
            onClick={runAutoFix}
            disabled={isFixing || !auditResults}
            variant="default"
            className="flex-1"
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Auto-Fix
              </>
            )}
          </Button>
        </div>

        {auditResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{auditResults.summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{auditResults.summary.passed}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{auditResults.summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{auditResults.summary.warnings}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Audit Results:</h4>
              {auditResults.results.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.component}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                    {result.fix && (
                      <div className="text-xs text-blue-600 mt-1">Fix: {result.fix}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {auditResults.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendations:</h4>
                <ul className="text-sm space-y-1">
                  {auditResults.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Last audit: {new Date(auditResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}