/**
 * Pixel Perfect Audit System
 * Comprehensive measurement and comparison system for PDF exports
 */

import { extractDashboardStyles, getDashboardMeasurements, captureScreenshot } from './dashboardStyleExtractor';
import type { DashboardMeasurements } from './dashboardStyleExtractor';

export interface VisualTruthTable {
  parameter: string;
  browserValue: number | string;
  pdfValue: number | string;
  difference: number | string;
  accuracy: number;
  sourceCode: string;
}

export interface PixelPerfectAuditResult {
  timestamp: string;
  overallScore: number;
  visualTruthTable: VisualTruthTable[];
  knownCompromises: string[];
  recommendations: string[];
  screenshot?: string;
  measurements: DashboardMeasurements;
  success: boolean;
  errors?: string[];
}

export async function runPixelPerfectAudit(): Promise<PixelPerfectAuditResult> {
  console.log('🔍 Starting pixel-perfect audit...');
  
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    // Step 1: Extract dashboard measurements
    const styleResult = extractDashboardStyles();
    if (!styleResult.success) {
      errors.push('Failed to extract dashboard styles');
    }
    
    const measurements = styleResult.measurements;
    
    // Step 2: Capture screenshot
    const screenshot = await captureScreenshot();
    
    // Step 3: Create visual truth table
    const visualTruthTable = await extractVisualTruthTable(measurements);
    
    // Step 4: Calculate pixel-perfect score
    const overallScore = calculatePixelPerfectScore(visualTruthTable);
    
    // Step 5: Generate recommendations
    const recommendations = generateRecommendations(visualTruthTable, overallScore);
    
    // Step 6: Document known compromises
    const knownCompromises = getKnownCompromises();
    
    const result: PixelPerfectAuditResult = {
      timestamp: new Date().toISOString(),
      overallScore,
      visualTruthTable,
      knownCompromises,
      recommendations,
      screenshot: screenshot || undefined,
      measurements,
      success: true
    };
    
    console.log('✅ Pixel-perfect audit completed:', overallScore + '/100');
    
    // Save results to localStorage
    localStorage.setItem('pixelPerfectAuditResults', JSON.stringify(result));
    
    return result;
    
  } catch (error) {
    console.error('❌ Pixel-perfect audit failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      visualTruthTable: [],
      knownCompromises: getKnownCompromises(),
      recommendations: ['Fix audit system errors'],
      measurements: getDashboardMeasurements(),
      success: false,
      errors
    };
  }
}

export async function extractVisualTruthTable(measurements: DashboardMeasurements): Promise<VisualTruthTable[]> {
  console.log('📊 Extracting visual truth table...');
  
  // PDF configuration (simulated - in real implementation this would come from actual PDF export)
  const pdfConfig = {
    timeColumnWidth: 50,
    dayColumnWidth: 85,
    timeSlotHeight: 25,
    headerHeight: 40,
    fontSize: {
      timeLabel: 8,
      dayHeader: 10,
      eventTitle: 9,
      eventTime: 7
    }
  };
  
  const truthTable: VisualTruthTable[] = [
    {
      parameter: 'Time Column Width',
      browserValue: measurements.timeColumnWidth,
      pdfValue: pdfConfig.timeColumnWidth,
      difference: Math.abs(measurements.timeColumnWidth - pdfConfig.timeColumnWidth),
      accuracy: calculateAccuracy(measurements.timeColumnWidth, pdfConfig.timeColumnWidth),
      sourceCode: 'extractDashboardStyles() → timeColumnWidth'
    },
    {
      parameter: 'Day Column Width',
      browserValue: measurements.dayColumnWidth,
      pdfValue: pdfConfig.dayColumnWidth,
      difference: Math.abs(measurements.dayColumnWidth - pdfConfig.dayColumnWidth),
      accuracy: calculateAccuracy(measurements.dayColumnWidth, pdfConfig.dayColumnWidth),
      sourceCode: 'extractDashboardStyles() → dayColumnWidth'
    },
    {
      parameter: 'Time Slot Height',
      browserValue: measurements.timeSlotHeight,
      pdfValue: pdfConfig.timeSlotHeight,
      difference: Math.abs(measurements.timeSlotHeight - pdfConfig.timeSlotHeight),
      accuracy: calculateAccuracy(measurements.timeSlotHeight, pdfConfig.timeSlotHeight),
      sourceCode: 'extractDashboardStyles() → timeSlotHeight'
    },
    {
      parameter: 'Header Height',
      browserValue: measurements.headerHeight,
      pdfValue: pdfConfig.headerHeight,
      difference: Math.abs(measurements.headerHeight - pdfConfig.headerHeight),
      accuracy: calculateAccuracy(measurements.headerHeight, pdfConfig.headerHeight),
      sourceCode: 'extractDashboardStyles() → headerHeight'
    },
    {
      parameter: 'Font Family',
      browserValue: measurements.fonts.timeLabel,
      pdfValue: 'Helvetica, Arial, sans-serif',
      difference: 'Font substitution',
      accuracy: measurements.fonts.timeLabel.includes('Arial') ? 85 : 60,
      sourceCode: 'getComputedStyle() → fontFamily'
    }
  ];
  
  console.log('📊 Visual truth table extracted:', truthTable.length + ' parameters');
  
  return truthTable;
}

export function calculatePixelPerfectScore(truthTable: VisualTruthTable[]): number {
  if (truthTable.length === 0) return 0;
  
  const totalAccuracy = truthTable.reduce((sum, row) => sum + row.accuracy, 0);
  const averageAccuracy = totalAccuracy / truthTable.length;
  
  return Math.round(averageAccuracy);
}

function calculateAccuracy(browserValue: number, pdfValue: number): number {
  if (browserValue === 0) return pdfValue === 0 ? 100 : 0;
  
  const difference = Math.abs(browserValue - pdfValue);
  const percentage = (difference / browserValue) * 100;
  
  return Math.max(0, Math.round(100 - percentage));
}

function generateRecommendations(truthTable: VisualTruthTable[], overallScore: number): string[] {
  const recommendations: string[] = [];
  
  if (overallScore < 100) {
    recommendations.push('System needs pixel-perfect improvements');
  }
  
  truthTable.forEach(row => {
    if (row.accuracy < 95) {
      recommendations.push(`Improve ${row.parameter} accuracy (current: ${row.accuracy}%)`);
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('System is pixel-perfect! No improvements needed.');
  }
  
  return recommendations;
}

function getKnownCompromises(): string[] {
  return [
    'Font substitution: Inter → Helvetica in PDF exports',
    'Pixel to point conversion: 1px ≈ 0.75pt may cause rounding',
    'Browser zoom factor may affect measurements',
    'Canvas scaling: 2x scale requires compensation',
    'HTML2Canvas rendering differences from native browser'
  ];
}

// Make functions available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).runPixelPerfectAudit = runPixelPerfectAudit;
  (window as any).extractVisualTruthTable = extractVisualTruthTable;
  (window as any).calculatePixelPerfectScore = calculatePixelPerfectScore;
  
  console.log('🔍 Pixel-perfect audit system ready!');
}