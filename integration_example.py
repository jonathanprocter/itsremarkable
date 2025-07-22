#!/usr/bin/env python3
"""
Example of how to integrate the bidirectional weekly package generator
into your existing Replit export functions.
"""

from replit_integration import create_bidirectional_weekly_package
import os

def example_integration():
    """
    Example showing how to integrate with your existing export functions.
    Replace the file paths with your actual generated PDFs.
    """
    
    print("📝 Example Integration")
    print("=" * 30)
    
    # These would come from your existing export functions:
    # weekly_pdf = await exportCurrentWeeklyView(startDate)
    # daily_pdfs = []
    # for i in range(7):
    #     daily_pdf = await exportBrowserReplicaPDF(date + i)
    #     daily_pdfs.append(daily_pdf)
    
    # Example file paths (replace with your actual paths):
    weekly_pdf = "weekly-planner.pdf"
    daily_pdfs = [
        "monday.pdf",
        "tuesday.pdf", 
        "wednesday.pdf",
        "thursday.pdf",
        "friday.pdf",
        "saturday.pdf",
        "sunday.pdf"
    ]
    
    output_path = "bidirectional-weekly-package.pdf"
    
    print(f"📄 Weekly PDF: {weekly_pdf}")
    print(f"📄 Daily PDFs: {len(daily_pdfs)} files")
    print(f"📄 Output: {output_path}")
    
    # Create the linked package
    print("\n🔗 Creating bidirectional weekly package...")
    success = create_bidirectional_weekly_package(weekly_pdf, daily_pdfs, output_path)
    
    if success:
        print("✅ SUCCESS! Bidirectional weekly package created!")
        return output_path
    else:
        print("❌ FAILED to create bidirectional weekly package")
        return None

if __name__ == "__main__":
    result = example_integration()
    if result:
        print(f"\n🎉 Created: {result}")
    else:
        print("\n💥 Integration example failed (expected - need actual PDF files)")
