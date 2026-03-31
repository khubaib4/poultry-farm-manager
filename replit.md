# Overview

This project is a pnpm workspace monorepo using TypeScript, designed for a comprehensive poultry farm management system. It features an Electron-based desktop application for farm operations and an Express API server for backend services. The system aims to optimize farm management by providing tools for flock, daily entry, expenses, revenue, inventory, vaccinations, and financial reporting, ultimately improving efficiency and offering data-driven insights to poultry farm owners.

# User Preferences

I prefer clear, concise explanations and direct answers.
I like an iterative development approach, where features are built and reviewed incrementally.
Please ask for my confirmation before implementing any major architectural changes or significant feature modifications.
I expect the agent to prioritize the use of established patterns and best practices.
Do not make changes to files outside the explicitly requested scope.
I prefer detailed explanations for complex solutions or decisions.
I like functional programming paradigms where appropriate, especially for data transformation and utility functions.
Ensure all code is well-documented, especially public interfaces and complex logic.

# System Architecture

The project is structured as a pnpm workspace monorepo to promote modularity and shared code.

**Monorepo Structure:**
- `artifacts/`: Contains deployable applications.
- `lib/`: Houses shared libraries (e.g., API specifications, database utilities).
- `scripts/`: Holds utility scripts.

**Core Technologies:**
- **Node.js**: 24
- **TypeScript**: 5.9
- **Package Manager**: pnpm
- **API Framework**: Express 5
- **Desktop Application Framework**: Electron with React 18
- **Database**: PostgreSQL with Drizzle ORM for the API server, SQLite with Drizzle ORM for the Electron app.
- **Validation**: Zod (v4).

**TypeScript Configuration:**
- Utilizes TypeScript composite projects for efficient type-checking and dependency management across packages.

**Electron Desktop Application (`poultry-farm-manager`):**
- **UI/UX**: React 18, Tailwind CSS for styling with a desktop-first, responsive approach.
- **Routing**: `react-router-dom` v7 with `HashRouter` and role-based access control.
- **State Management**: Zustand for authentication, React Context for shared state.
- **Authentication**: Supports Owner and Farm login modes with session persistence.
- **Key Features:**
    - **Flock Management**: CRUD operations, auto-vaccination scheduling, status, and performance tracking.
    - **Daily Entry**: Records mortality, egg production, feed, water, and notes.
    - **Farm Dashboard**: Displays live stats, performance metrics, and alerts.
    - **Expenses & Revenue**: Full CRUD for financial tracking and reporting.
    - **Financial Dashboard & P&L**: Comprehensive financial reporting and trend analysis.
    - **Inventory Management**: Tracks feed, medicine, and equipment with stock alerts.
    - **Vaccination Management**: Automated scheduling and history tracking.
    - **Report Generation**: Multiple report types (PDF, Excel, Print export).
    - **Alerts System**: Centralized system for low stock, expiring items, and overdue tasks.
    - **Customer Management**: CRUD for tracking egg buyers, including contact details and payment terms.
    - **Sales Recording System**: Full sales CRUD, automatic invoice generation, customer selection, item entry, discount support, and payment tracking.
    - **Payment Recording & Receivables System**: Manages receivables, credit, and balance tracking with payment reminders and alerts.
    - **PDF Invoice System**: Generates, downloads, and prints professional PDF invoices.
    - **Owner Dashboard**: Provides a multi-farm overview with global summaries, farm comparison, and consolidated alerts.
    - **Farm Comparison**: Dedicated page for comparing farm performance with charts and detailed KPIs.
    - **Database Backup & Restore**: Manual and auto-backup capabilities with configurable settings and restore functionality.
- **UI Components**: Reusable components (`LoadingSpinner`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `Skeleton`, `Toast`, `PageHeader`) for consistent UI.

**API Server (`api-server`):**
- An Express 5 server that handles all API requests.
- Integrates with `@workspace/api-zod` for request validation and `@workspace/db` for database operations.

**Database Layer (`lib/db`):**
- Utilizes Drizzle ORM for database interactions, supporting PostgreSQL for the API and SQLite for the Electron app.
- Drizzle Kit is used for database migrations.

**API Specification and Codegen (`lib/api-spec`):**
- Defines the OpenAPI 3.1 specification (`openapi.yaml`).
- Employs Orval for generating React Query hooks (`lib/api-client-react`) and Zod schemas (`lib/api-zod`) from the OpenAPI spec.

# External Dependencies

- **PostgreSQL**: Main database for the API server.
- **SQLite**: Local database for the Electron application.
- **Drizzle ORM**: For database interactions.
- **Express**: API server framework.
- **React**: Frontend library for the desktop application.
- **Electron**: Desktop application framework.
- **Tailwind CSS**: Utility-first CSS framework.
- **Zod**: Schema validation.
- **Orval**: OpenAPI client code generator.
- **`react-router-dom`**: For client-side routing.
- **Zustand**: State management.
- **`electron-store`**: Data persistence in Electron.
- **`recharts`**: Charting library.
- **`jspdf` and `jspdf-autotable`**: For PDF report generation.
- **`xlsx/SheetJS`**: For Excel report generation.
- **`pnpm`**: Package manager.
- **`esbuild`**: JavaScript bundler.