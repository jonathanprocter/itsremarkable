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
