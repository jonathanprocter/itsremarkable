import { Button } from '@/components/ui/button';
import { runPixelPerfectAudit } from '@/utils/pixelPerfectAudit';
import { pdfPerfectionTester } from '@/utils/pdfPerfectionTest';
import { pixelPerfectReviewer } from '@/utils/pixelPerfectReview';
import { comprehensivePixelAnalyzer } from '@/utils/comprehensivePixelAnalysis';
import { exportPixelPerfectPDF } from '@/utils/pixelPerfectPDFExportFixed';
import { exportExactGridPDF } from '../../utils/exactGridPDFExport';
import { exportDailyToPDF } from '../../utils/dailyPDFExport';

interface ExportToPDFProps {
  isGoogleConnected: boolean;
  onExportCurrentView: (type?: string) => void;
  onExportWeeklyPackage: () => void;
  onExportDailyView: () => void;
  onExportFullMonth: () => void;
  onExportToGoogleDrive: (type: string) => void;
}

export const ExportToPDF = ({
  isGoogleConnected,
  onExportCurrentView,
  onExportWeeklyPackage,
  onExportDailyView,
  onExportFullMonth,
  onExportToGoogleDrive
}: ExportToPDFProps) => {
  // ExportToPDF component rendered

  // Make the export function globally available for testing
  (window as any).testDailyExport = () => {
    // Global test export called
    onExportCurrentView('Daily View');
  };

  // Also make it available with a simple name
  (window as any).export = () => {
    // Simple export called
    onExportCurrentView('Daily View');
  };

  // Add simple PDF export test
  (window as any).testSimplePDF = async () => {
    try {
      // Testing Simple PDF Export

      // Import the simple PDF export function
      const { exportSimplePDF } = await import('../../utils/simplePDFExport');

      // Use current date and get events for today
      const testDate = new Date();
      const events = (window as any).currentEvents || [];
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === testDate.toDateString();
      });

      // Exporting Simple PDF for date
      // Events for this date

      await exportSimplePDF(testDate, todayEvents);

      // Simple PDF test completed successfully

    } catch (error) {
      // Simple PDF test failed
    }
  };

  // Add pixel-perfect review function
  (window as any).runPixelPerfectReview = async () => {
    try {
      console.log('🔍 Running Pixel-Perfect Review');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];

      console.log('Reviewing for date:', testDate.toDateString());
      console.log('Events for analysis:', events.length);

      const results = await pixelPerfectReviewer.runPixelPerfectReview(testDate, events);

      console.log('\n🎯 PIXEL-PERFECT REVIEW RESULTS:');
      console.log('='.repeat(80));
      console.log(`📊 Overall Score: ${results.overallScore}/${results.maxScore} (${results.percentage}%)`);
      console.log(`🔧 Issues Found: ${results.issues.length}`);
      console.log(`💡 Recommendations: ${results.recommendations.length}`);

      if (results.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        results.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Expected: ${issue.expected}`);
          console.log(`   Actual: ${issue.actual}`);
          console.log(`   Fix: ${issue.fixRecommendation}\n`);
        });
      }

      if (results.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      console.log('\n📊 OVERLAY ANALYSIS:');
      console.log(`Grid Alignment: ${results.visualComparison.overlayAnalysis.gridAlignment}%`);
      console.log(`Text Alignment: ${results.visualComparison.overlayAnalysis.textAlignment}%`);
      console.log(`Color Accuracy: ${results.visualComparison.overlayAnalysis.colorAccuracy}%`);
      console.log(`Spacing Consistency: ${results.visualComparison.overlayAnalysis.spacingConsistency}%`);
      console.log(`Element Positioning: ${results.visualComparison.overlayAnalysis.elementPositioning}%`);

      // Save results to localStorage
      localStorage.setItem('pixelPerfectReviewResults', JSON.stringify(results));

      console.log('✅ Pixel-Perfect Review completed successfully');

      return results;

    } catch (error) {
      console.error('❌ Pixel-Perfect Review failed:', error);
    }
  };

  // Add comprehensive pixel analysis function
  (window as any).runComprehensivePixelAnalysis = async () => {
    try {
      console.log('🔍 Running Comprehensive Pixel Analysis');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];

      console.log('Analyzing for date:', testDate.toDateString());
      console.log('Events for analysis:', events.length);

      const results = await comprehensivePixelAnalyzer.runComprehensiveAnalysis(testDate, events);

      console.log('\n🎯 COMPREHENSIVE PIXEL ANALYSIS RESULTS:');
      console.log('='.repeat(100));
      console.log(`📊 Overall Score: ${results.overallScore}/${results.maxScore} (${results.percentage}%)`);
      console.log(`🔧 Issues Found: ${results.issues.length}`);
      console.log(`💡 Recommendations: ${results.recommendations.length}`);

      console.log('\n📏 DETAILED MEASUREMENTS:');
      console.log('Dashboard Measurements:', results.measurements.dashboard);
      console.log('Expected PDF Measurements:', results.measurements.expectedPDF);
      console.log('Measurement Differences:', results.measurements.differences);

      if (results.issues.length > 0) {
        console.log('\n❌ DETAILED ISSUES:');
        results.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Dashboard: ${issue.dashboardValue}`);
          console.log(`   Expected PDF: ${issue.expectedPDFValue}`);
          console.log(`   Difference: ${issue.actualDifference}`);
          console.log(`   Impact Score: ${issue.impactScore}/100`);
          console.log(`   Fix: ${issue.fixRecommendation}`);
          console.log(`   Code Location: ${issue.codeLocation}\n`);
        });
      }

      if (results.recommendations.length > 0) {
        console.log('\n💡 COMPREHENSIVE RECOMMENDATIONS:');
        results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      // Save results to localStorage
      localStorage.setItem('comprehensivePixelAnalysisResults', JSON.stringify(results));

      console.log('✅ Comprehensive Pixel Analysis completed successfully');

      return results;

    } catch (error) {
      console.error('❌ Comprehensive Pixel Analysis failed:', error);
    }
  };

  // Add pixel-perfect PDF export function
  (window as any).exportPixelPerfectPDF = async () => {
    try {
      console.log('🎯 Running Pixel-Perfect PDF Export');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === testDate.toDateString();
      });

      console.log('Exporting for date:', testDate.toDateString());
      console.log('Events for export:', todayEvents.length);

      await exportPixelPerfectPDF(testDate, todayEvents);

      console.log('✅ Pixel-Perfect PDF Export completed successfully');

    } catch (error) {
      console.error('❌ Pixel-Perfect PDF Export failed:', error);
    }
  };

  // Add pixel-perfect audit test function
  (window as any).testPixelPerfectAudit = async () => {
    try {
      console.log('🔍 STARTING PIXEL-PERFECT AUDIT TEST FROM CONSOLE');
      console.log('='.repeat(80));

      // Get current date and events from window context
      const selectedDate = new Date(); // Default to today
      const events = (window as any).currentEvents || [];

      console.log(`📅 Auditing date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${events.length}`);

      // Run comprehensive audit
      const auditResults = await runPixelPerfectAudit(selectedDate, events);

      // Display results
      console.log('\n🎯 PIXEL-PERFECT AUDIT RESULTS:');
      console.log('='.repeat(50));
      console.log(`📊 Overall Score: ${auditResults.score}/${auditResults.maxScore} (${auditResults.percentage}%)`);
      console.log(`🔧 Issues Found: ${auditResults.issues.length}`);
      console.log(`📋 Recommendations: ${auditResults.recommendations.length}`);

      // Log detailed results
      if (auditResults.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        auditResults.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Expected: ${issue.expected}`);
          console.log(`   Actual: ${issue.actual}`);
          console.log(`   Fix: ${issue.fixRecommendation}`);
          console.log('');
        });
      }

      // Log recommendations
      if (auditResults.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        auditResults.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      // Store results in localStorage
      localStorage.setItem('pixelPerfectAuditResults', JSON.stringify(auditResults));
      console.log('\n✅ Pixel-perfect audit completed! Results saved to localStorage.');

    } catch (error) {
      console.error('❌ Pixel-perfect audit failed:', error);
    }
  };

  // Add comprehensive PDF perfection test function
  (window as any).testPDFPerfection = async () => {
    try {
      console.log('🎯 STARTING COMPREHENSIVE PDF PERFECTION TEST');
      console.log('='.repeat(80));

      // Get current date and events from window context
      const selectedDate = new Date(); // Default to today
      const events = (window as any).currentEvents || [];

      console.log(`📅 Testing date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${events.length}`);

      // Run comprehensive perfection test
      const perfectionResults = await pdfPerfectionTester.runComprehensivePerfectionTest(selectedDate, events);

      // Generate and display report
      const report = pdfPerfectionTester.generateTestReport(perfectionResults);
      console.log(report);

      // Save results to localStorage for external access
      localStorage.setItem('pdfPerfectionTestResults', JSON.stringify({
        timestamp: new Date().toISOString(),
        date: selectedDate.toISOString(),
        eventCount: events.length,
        results: perfectionResults,
        report: report
      }));

      console.log('\n✅ PDF perfection test completed! Results saved to localStorage.');

    } catch (error) {
      console.error('❌ PDF perfection test failed:', error);
      console.error('Error details:', error.message);
    }
  };

  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Export Options</h3>

      {/* Daily View Export */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">📅 Daily View</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Daily View')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📄 Export Daily View
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Dynamic Daily Planner')}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            size="sm"
          >
            🎯 Dynamic Daily Planner PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Dynamic Daily HTML')}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🌐 Dynamic Daily HTML
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Preview Dynamic Daily')}
            className="w-full text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            size="sm"
          >
            👁️ Preview Dynamic Daily
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('perfect-daily-replica')}
            className="w-full text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            size="sm"
          >
            🎯 Perfect Daily Replica
          </Button>
        </div>
      </div>

      {/* PDF Perfection Test */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">🎯 PDF Perfection</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => (window as any).testPDFPerfection()}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🎯 Test PDF Perfection
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).testPixelPerfectAudit()}
            className="w-full text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            size="sm"
          >
            🔍 Pixel-Perfect Audit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).testSimplePDF()}
            className="w-full text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            size="sm"
          >
            🚀 Test Simple PDF Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).runPixelPerfectReview()}
            className="w-full text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            size="sm"
          >
            🔍 Pixel-Perfect Review
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).runComprehensivePixelAnalysis()}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🔬 Comprehensive Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).exportPixelPerfectPDF()}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            size="sm"
          >
            🎯 100% Pixel-Perfect Export
          </Button>
        </div>
      </div>

      {/* Google Drive Export Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">☁️ Google Drive</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('current')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
            disabled={!isGoogleConnected}
          >
            {isGoogleConnected ? '☁️ Current to Drive' : (
              <>
                Export Current View
                <br />
                (Connect Google First)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Google Calendar Sync Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">🔄 Calendar Sync</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔄 Force syncing Google Calendar...');
              window.location.href = '/api/auth/google';
            }}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            🔄 Force Sync Google Calendar
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                console.log('🔄 Testing live sync...');
                const response = await fetch('/api/live-sync/calendar/events?start=2025-01-01&end=2025-12-31');
                if (response.ok) {
                  const data = await response.json();
                  console.log(`✅ Live sync successful: ${data.events.length} events`);
                  alert(`Live sync successful: ${data.events.length} events found`);
                  window.location.reload();
                } else {
                  const error = await response.json();
                  console.log(`❌ Live sync failed: ${error.error}`);
                  alert(`Live sync failed: ${error.error}. Please re-authenticate.`);
                }
              } catch (error) {
                console.error('Live sync error:', error);
                alert('Live sync failed. Please try Force Sync Google Calendar first.');
              }
            }}
            className="w-full text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            size="sm"
          >
            🧪 Test Live Sync
          </Button>
        </div>
      </div>

      {/* Weekly Export */}
      <div className="border-t pt-3 mt-3">
        <p className="text-xs text-gray-600 mb-2">📅 Weekly Export</p>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log('🎯 PERFECT WEEKLY EXPORT - OPTIMIZED TYPOGRAPHY!');
            onExportCurrentView('Exact Weekly Spec');
          }}
          className="w-full text-xs mb-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          size="sm"
        >
          📅 Export Weekly Calendar
        </Button>
      </div>
    </div>
  );
};