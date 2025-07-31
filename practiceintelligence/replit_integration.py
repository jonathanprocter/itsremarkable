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
