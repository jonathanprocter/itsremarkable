#!/bin/bash

# Bidirectional Weekly Package Generator Setup Script for Replit
# Save this as setup_replit_bidirectional.sh and run: bash setup_replit_bidirectional.sh

set -e  # Exit on any error

echo "🚀 Setting up Bidirectional Weekly Package Generator for Replit..."
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Install Python dependencies
print_info "Installing Python dependencies..."
pip install PyMuPDF
print_status "PyMuPDF installed successfully"

# Step 2: Create the main integration module
print_info "Creating replit_integration.py..."
cat > replit_integration.py << 'EOF'
"""
Replit Integration Module for Bidirectional Weekly Package Generation

This module provides a simple function that can be integrated into your existing
Replit codebase to generate bidirectionally linked weekly packages.
"""

import fitz  # PyMuPDF
import os
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


def create_bidirectional_weekly_package(weekly_pdf_path: str, 
                                       daily_pdf_paths: List[str], 
                                       output_path: str) -> bool:
    """
    Creates a bidirectionally linked 8-page weekly package PDF.
    
    This function can be called from your existing export functions to add
    bidirectional linking to the generated PDFs.
    
    Args:
        weekly_pdf_path (str): Path to the weekly planner PDF (landscape)
        daily_pdf_paths (List[str]): List of 7 daily PDF paths (Monday-Sunday, portrait)
        output_path (str): Path where the linked PDF should be saved
        
    Returns:
        bool: True if successful, False otherwise
        
    Example:
        # In your existing export function:
        weekly_path = "path/to/weekly.pdf"
        daily_paths = [
            "path/to/monday.pdf",
            "path/to/tuesday.pdf",
            # ... etc for all 7 days
        ]
        output_path = "path/to/linked_weekly_package.pdf"
        
        success = create_bidirectional_weekly_package(weekly_path, daily_paths, output_path)
        if success:
            print("✅ Linked weekly package created successfully!")
        else:
            print("❌ Failed to create linked package")
    """
    try:
        # Validate inputs
        if not os.path.exists(weekly_pdf_path):
            logger.error(f"Weekly PDF not found: {weekly_pdf_path}")
            return False
            
        if len(daily_pdf_paths) != 7:
            logger.error(f"Expected 7 daily PDFs, got {len(daily_pdf_paths)}")
            return False
            
        for i, daily_pdf in enumerate(daily_pdf_paths):
            if not os.path.exists(daily_pdf):
                logger.error(f"Daily PDF {i+1} not found: {daily_pdf}")
                return False
        
        # Create new PDF document
        doc = fitz.open()
        
        # Add weekly page (page 0)
        weekly_doc = fitz.open(weekly_pdf_path)
        doc.insert_pdf(weekly_doc)
        weekly_doc.close()
        
        # Add daily pages (pages 1-7)
        for daily_pdf_path in daily_pdf_paths:
            daily_doc = fitz.open(daily_pdf_path)
            doc.insert_pdf(daily_doc)
            daily_doc.close()
        
        # Add hyperlinks
        _add_hyperlinks_to_package(doc)
        
        # Save the final document
        doc.save(output_path)
        doc.close()
        
        logger.info(f"Successfully created linked PDF: {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating linked weekly package: {str(e)}")
        return False


def _add_hyperlinks_to_package(doc: fitz.Document):
    """Adds all hyperlinks to the weekly package document."""
    
    # Page mapping: 0=weekly, 1=monday, 2=tuesday, ..., 7=sunday
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    # Add links from weekly page to daily pages
    weekly_page = doc[0]
    page_rect = weekly_page.rect
    width = page_rect.width
    height = page_rect.height
    
    # Calculate day column areas (assuming 7 equal columns after time column)
    time_column_width = width * 0.08
    day_column_width = (width - time_column_width) / 7
    header_height = height * 0.12
    
    for i, day in enumerate(days):
        # Day header clickable area
        x1 = time_column_width + (i * day_column_width)
        y1 = 0
        x2 = x1 + day_column_width
        y2 = header_height
        
        header_rect = fitz.Rect(x1, y1, x2, y2)
        daily_page_num = i + 1  # Pages 1-7
        
        # Add link from day header to daily page
        weekly_page.insert_link({
            "kind": fitz.LINK_GOTO,
            "from": header_rect,
            "page": daily_page_num,
            "to": fitz.Point(0, 0)
        })
    
    # Add links from daily pages back to weekly and to adjacent days
    for i, day in enumerate(days):
        page_num = i + 1  # Pages 1-7
        daily_page = doc[page_num]
        page_rect = daily_page.rect
        width = page_rect.width
        height = page_rect.height
        
        # Weekly Overview button areas (top and bottom)
        # Top weekly overview button
        top_weekly_rect = fitz.Rect(15, 15, 150, 60)
        daily_page.insert_link({
            "kind": fitz.LINK_GOTO,
            "from": top_weekly_rect,
            "page": 0,  # Weekly page
            "to": fitz.Point(0, 0)
        })
        
        # Bottom weekly overview button
        bottom_weekly_rect = fitz.Rect(width * 0.4, height - 60, width * 0.6, height - 15)
        daily_page.insert_link({
            "kind": fitz.LINK_GOTO,
            "from": bottom_weekly_rect,
            "page": 0,  # Weekly page
            "to": fitz.Point(0, 0)
        })
        
        # Date title area also links to weekly
        date_title_rect = fitz.Rect(width * 0.25, 15, width * 0.75, 60)
        daily_page.insert_link({
            "kind": fitz.LINK_GOTO,
            "from": date_title_rect,
            "page": 0,  # Weekly page
            "to": fitz.Point(0, 0)
        })
        
        # Previous day navigation (except for Monday)
        if i > 0:  # Not Monday
            prev_day_rect = fitz.Rect(15, height - 60, 100, height - 15)
            daily_page.insert_link({
                "kind": fitz.LINK_GOTO,
                "from": prev_day_rect,
                "page": i,  # Previous day page (i-1+1 = i)
                "to": fitz.Point(0, 0)
            })
        
        # Next day navigation (except for Sunday)
        if i < 6:  # Not Sunday
            next_day_rect = fitz.Rect(width - 100, height - 60, width - 15, height - 15)
            daily_page.insert_link({
                "kind": fitz.LINK_GOTO,
                "from": next_day_rect,
                "page": i + 2,  # Next day page (i+1+1 = i+2)
                "to": fitz.Point(0, 0)
            })


if __name__ == "__main__":
    print("✅ Replit integration module ready!")
    print("📋 Usage:")
    print("   from replit_integration import create_bidirectional_weekly_package")
    print("   success = create_bidirectional_weekly_package(weekly_pdf, daily_pdfs, output_pdf)")
EOF

print_status "replit_integration.py created"

# Step 3: Create a simple test script
print_info "Creating test script..."
cat > test_setup.py << 'EOF'
#!/usr/bin/env python3
"""
Test script to verify the bidirectional weekly package setup.
"""

import os
import sys

def test_setup():
    """Test that everything is set up correctly."""
    
    print("🧪 Testing Bidirectional Weekly Package Setup")
    print("=" * 50)
    
    # Test 1: Check if PyMuPDF is installed
    try:
        import fitz
        print("✅ PyMuPDF (fitz) is installed")
    except ImportError:
        print("❌ PyMuPDF (fitz) is not installed")
        return False
    
    # Test 2: Check if integration module exists
    if os.path.exists('replit_integration.py'):
        print("✅ replit_integration.py exists")
    else:
        print("❌ replit_integration.py not found")
        return False
    
    # Test 3: Try to import the integration module
    try:
        from replit_integration import create_bidirectional_weekly_package
        print("✅ Integration module imports successfully")
    except ImportError as e:
        print(f"❌ Failed to import integration module: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Setup is complete.")
    print("\n📋 Next Steps:")
    print("1. Integrate into your existing export code:")
    print("   from replit_integration import create_bidirectional_weekly_package")
    print("   success = create_bidirectional_weekly_package(weekly_pdf, daily_pdfs, output_pdf)")
    print("2. Test with your actual PDF files")
    print("3. Customize link coordinates if needed for your layout")
    
    return True

if __name__ == "__main__":
    success = test_setup()
    sys.exit(0 if success else 1)
EOF

print_status "test_setup.py created"

# Step 4: Create integration example
print_info "Creating integration example..."
cat > integration_example.py << 'EOF'
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
EOF

print_status "integration_example.py created"

# Step 5: Run the test to verify everything works
print_info "Running setup verification test..."
python3 test_setup.py

# Final summary
echo ""
echo "=================================================================="
print_status "🎉 Bidirectional Weekly Package Generator Setup Complete!"
echo ""
print_info "📁 Files created in your current directory:"
echo "   • replit_integration.py - Main Python integration module"
echo "   • test_setup.py - Setup verification test"
echo "   • integration_example.py - Integration example"
echo ""
print_info "📋 Quick Integration (add to your existing export function):"
echo "   from replit_integration import create_bidirectional_weekly_package"
echo "   success = create_bidirectional_weekly_package(weekly_pdf, daily_pdfs, output_pdf)"
echo ""
print_info "🧪 To test your setup anytime, run:"
echo "   python3 test_setup.py"
echo ""
print_status "Ready to integrate! 🚀"

