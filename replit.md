# reMarkable Pro Digital Planner

## Overview
The reMarkable Pro Digital Planner is a React-based single-page application tailored for the reMarkable Pro tablet. It offers a comprehensive digital planning experience, featuring weekly and daily calendar views, Google Calendar integration, and PDF export capabilities. The project aims to deliver a high-contrast, e-ink optimized planning tool that seamlessly integrates with existing productivity ecosystems like Notion and Google Drive, streamlining personal and professional workflows for enhanced market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

The application adopts a monorepo structure, separating client, server, and shared code.

**Frontend:**
-   **Framework:** React 18 with TypeScript.
-   **Routing:** Wouter for client-side navigation.
-   **State Management:** React hooks with custom calendar state management and TanStack Query for server state.
-   **UI:** shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS.
-   **Target Device:** Optimized for reMarkable Pro (1404x1872 resolution), e-ink display, and stylus interaction.
-   **Design:** High-contrast color scheme, two-column layout, and clean typography.

**Backend:**
-   **Server:** Express.js with TypeScript, providing a REST API.
-   **Database:** PostgreSQL with Drizzle ORM for type-safe operations.
-   **Session Management:** Express sessions with PostgreSQL storage.

**Data Model:**
-   **Users:** Authentication and management.
-   **Events:** Calendar events from manual input, Google Calendar, and SimplePractice.
-   **Daily Notes:** Date-specific notes and planning content.

**Key Features & Implementations:**
-   **Comprehensive Notion Integration:** Full bidirectional synchronization with Notion databases (Client Management, Task Tracker, Session Notes, Project Pipeline), including automated event creation and client linking.
-   **Google Drive Integration:** Basic functionality for verifying connection, creating folders, and uploading files for PDF exports.
-   **Authentication System:** Robust session persistence, token management (including refresh), OAuth2 flow for Google services, and secure API endpoint protection.
-   **PDF Export System:**
    -   Pixel-perfect generation for weekly (8-page package) and daily views.
    -   Bidirectional linking within PDFs for seamless navigation.
    -   Utilization of actual template elements and rendering functions for authenticity.
    -   Dynamic date selection, military time format, and comprehensive styling consistency.
    -   Advanced features like overlapping appointment detection, custom styling for different event sources (SimplePractice, Google Calendar, Holidays), and dynamic content rendering (notes, action items).
    -   Export options include "Current Weekly Layout", "EXACT HTML Browser Replica", "Unified Bidirectional Export", and "PyMyPDF Bidirectional".
-   **Smart Calendar Intelligence:**
    -   **Conflict Detection:** Real-time analysis for overlapping appointments, travel time, and intensive session spacing.
    -   **Client Management System:** Professional database for client information, preferred locations, rates, and tags.
    -   **Revenue Analytics:** Dashboard for tracking monthly revenue, session counts, and performance insights.
    -   **Appointment Templates:** Quick scheduling using pre-configured appointment types.
-   **UI/UX Optimization:** Streamlined 4-tab interface (Calendar, Productivity, Appointments, Export) with nested organization to reduce clutter and improve navigation.
-   **Workflow Automation:** Integration with Notion and Slack for automated tasks, notifications, and AI-powered insights.

## External Dependencies

**Core Technologies:**
-   React, React DOM
-   Wouter (for routing)
-   Radix UI, shadcn/ui (for UI components)
-   Drizzle ORM
-   Neon (serverless PostgreSQL)
-   Tailwind CSS
-   Vite (build tool)
-   TypeScript

**Third-Party Integrations:**
-   Google Calendar API
-   Google Drive API
-   Notion API
-   SimplePractice (healthcare scheduling)
-   Slack API
-   html2canvas (for HTML to canvas rendering for PDF)
-   jsPDF (for PDF generation)

**Development Tools:**
-   ESLint
-   Prettier (implicitly)
-   Vite