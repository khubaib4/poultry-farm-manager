# Overview

This project is a pnpm workspace monorepo utilizing TypeScript, designed for a poultry farm management system. It comprises a desktop application (Electron + React) for farm operations and an Express API server for backend services. The system aims to provide comprehensive tools for managing flocks, daily entries, expenses, revenue, inventory, vaccinations, and financial reporting, offering a robust solution for poultry farm owners.

The project's vision is to streamline farm management processes, improve efficiency, and provide actionable insights through data-driven reporting.

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

The project is structured as a pnpm workspace monorepo, facilitating shared libraries and modular development.

**Monorepo Structure:**
- `artifacts/`: Deployable applications (e.g., `api-server`, `poultry-farm-manager`).
- `lib/`: Shared libraries (`api-spec`, `api-client-react`, `api-zod`, `db`).
- `scripts/`: Utility scripts.

**Core Technologies:**
- **Node.js**: 24
- **TypeScript**: 5.9
- **Package Manager**: pnpm
- **API Framework**: Express 5
- **Desktop Application Framework**: Electron with React 18
- **Database**: PostgreSQL with Drizzle ORM for the API server, SQLite with Drizzle ORM for the Electron app.
- **Validation**: Zod (v4), `drizzle-zod`.
- **API Codegen**: Orval (from OpenAPI spec).
- **Build Tool**: esbuild.

**TypeScript & Composite Projects:**
- All packages extend a base `tsconfig.base.json` with `composite: true`.
- The root `tsconfig.json` lists all packages as project references, enabling cross-package type-checking and dependency resolution.
- `emitDeclarationOnly` is used for type-checking, with actual JS bundling handled by esbuild.

**Electron Desktop Application (`poultry-farm-manager`):**
- **UI/UX**: React 18, Tailwind CSS v3, shadcn/ui for design tokens. Responsive design with desktop-first approach.
- **Routing**: `react-router-dom` v7 with `HashRouter` for navigation within the app, implementing role-based access control for routes.
- **State Management**: Zustand for authentication, React Context for shared state.
- **Authentication**: Supports Owner (email/password) and Farm (username/password) login modes, with session persistence via `electron-store`. Server-side auth guards protect IPC handlers.
- **Key Features:**
    - **Flock Management**: CRUD operations, auto-vaccination scheduling, status tracking, computed stats (age, mortality, production).
    - **Daily Entry**: Record mortality, egg production, feed consumption, water, notes. Enforces one entry per flock per day.
    - **Farm Dashboard**: Live stats (total birds, today's eggs, deaths, feed), performance metrics (production rate, mortality, FCR), entry status, and alerts panel. Auto-refreshes.
    - **Expenses**: Full CRUD for expense tracking across categories. Filtering, monthly summaries, supplier autocomplete.
    - **Revenue**: Tracks revenue from egg production against prices. Summaries, charts, and daily revenue tables.
    - **Financial Dashboard & P&L**: Comprehensive profit/loss reporting, financial trend charts, expense/revenue breakdown, per-unit metrics. Print and CSV export.
    - **Inventory Management**: Full CRUD for feed, medicine, and equipment. Stock status, low stock alerts, transaction history.
    - **Vaccination Management**: Automated scheduling based on flock age, upcoming/completed tracking, template management, and detailed history with compliance stats.
    - **Report Generation**: Five types of reports (Daily Summary, Weekly Performance, Monthly Summary, Flock Performance, Financial Report) with configurable parameters. Export to PDF, Excel, and Print.
    - **Low Stock Alerts**: Centralized system for low stock, expiring items, and overdue vaccinations, with severity levels and dismissal management.
    - **Customer Management**: Full CRUD for tracking egg buyers with categories (Retailer, Wholesaler, Restaurant/Hotel, Individual, Other). Contact details, payment terms (cash/credit), default pricing. Search/filter by name, phone, business, category, status. Grid and table view toggle. Customer detail page with contact info, payment/pricing, stats cards. Deactivate/reactivate support. IPC channels: `customers:create`, `customers:getByFarm`, `customers:getById`, `customers:update`, `customers:delete`, `customers:search`. Components: `src/components/customers/` (CategoryBadge, CustomerCard, CustomerTable). Hook: `src/hooks/useCustomers.ts`. Pages: CustomersPage, AddCustomerPage, EditCustomerPage, CustomerDetailPage. Routes: `/farm/customers`, `/farm/customers/new`, `/farm/customers/:customerId`, `/farm/customers/:customerId/edit`.
    - **Egg Pricing**: Manages egg prices by grade with effective dates and history.
    - **UI Components Library** (`src/components/ui/`): Reusable components used across all pages — `LoadingSpinner` (sizes: sm/md/lg), `EmptyState` (icon, title, description, optional action button), `ErrorState` (error message, retry button), `ConfirmDialog` (accessible modal with keyboard dismiss, danger/warning variants), `Skeleton` variants (SkeletonCard, SkeletonTable, SkeletonDashboard, SkeletonForm), `Toast` (success/error/warning/info notifications via ToastProvider context and useToast hook), `PageHeader`. Also `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) wrapping the entire app, and `print.css` (`src/styles/print.css`) for print-friendly output. Color palette standardized to `gray-*` (not `slate-*`). All routes use React lazy/Suspense for code splitting.
    - **Owner Dashboard**: Comprehensive multi-farm overview at `/owner/dashboard`. Global summary cards (Total Birds, Today's Eggs, Revenue, Profit) with trend indicators. Farm overview grid with per-farm stats (birds, eggs, production rate, mortality, profit margin), color-coded performance indicators (good/warning/critical), and entry status tracking. Farm comparison chart (recharts bar chart with metric selector: production rate, mortality, profit margin, birds, eggs, revenue, expenses, profit). Consolidated alerts grouped by farm with severity (critical/warning/info). Recent activity feed (entries, expenses, vaccinations) across all farms.
    - **Farm Comparison**: Dedicated comparison page at `/owner/compare`. Select farms via checkboxes, date range selector, bar chart comparison by metric, sortable comparison table with all KPIs, Excel export. IPC: `owner:getDashboardStats`, `owner:getFarmsOverview`, `owner:getFarmComparison`, `owner:getConsolidatedAlerts`, `owner:getRecentActivity`. Components: `src/components/owner/` (GlobalStatsCard, FarmOverviewCard, FarmComparisonChart, FarmComparisonTable, ConsolidatedAlerts, RecentActivityFeed). Hook: `src/hooks/useOwnerDashboard.ts` (auto-refresh every 5 minutes). Pages: `src/pages/owner/OwnerDashboardPage.tsx`, `src/pages/owner/FarmComparisonPage.tsx`. Performance thresholds: Good (production >85%, mortality <0.5%, profit margin >20%), Warning (70-85%, 0.5-1%, 10-20%), Critical (<70%, >1%, <10%).
    - **Database Backup & Restore**: Full backup/restore system accessible from both owner (`/owner/backup`) and farm (`/farm/backup`) sidebars. Manual backup via native Save dialog, restore via native Open dialog with validation and confirmation modal. Auto-backup scheduler with configurable frequency (daily/weekly), time, retention count, and custom directory. Safety backup created before every restore. WAL files properly handled. Path validation restricts file operations to allowed directories. IPC channels: `backup:create`, `backup:createToPath`, `backup:restore`, `backup:confirmRestore`, `backup:validate`, `backup:getHistory`, `backup:delete`, `backup:openFolder`, `backup:getSettings`, `backup:saveSettings`, `backup:runAutoBackup`, `backup:selectDirectory`. Core modules: `electron/backup.ts` (backup/restore/validate logic), `electron/autoBackup.ts` (scheduler with electron-store persistence). Page: `src/pages/BackupRestorePage.tsx`.

**API Server (`api-server`):**
- Express 5 server handling API requests.
- Uses `@workspace/api-zod` for request/response validation and `@workspace/db` for database interactions.
- Routes are organized in `src/routes/` and mounted under `/api`.

**Database Layer (`lib/db`):**
- Uses Drizzle ORM. PostgreSQL for the API server, SQLite for the Electron app.
- Exports a Drizzle client instance and schema models.
- Drizzle Kit is used for migrations.

**API Specification and Codegen (`lib/api-spec`):**
- Contains the OpenAPI 3.1 spec (`openapi.yaml`) and Orval configuration.
- Generates React Query hooks for client-side API interaction (`lib/api-client-react`) and Zod schemas for validation (`lib/api-zod`).

# External Dependencies

- **PostgreSQL**: Primary database for the API server.
- **SQLite**: Local database for the Electron desktop application (`better-sqlite3`).
- **Drizzle ORM**: Object-relational mapper for database interactions.
- **Express**: Web application framework for the API server.
- **React**: Frontend library for the desktop application.
- **Electron**: Framework for building cross-platform desktop applications.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Note**: No shadcn/ui — plain Tailwind CSS only.
- **Zod**: Schema declaration and validation library.
- **Orval**: OpenAPI client code generator.
- **`react-router-dom`**: For client-side routing in the React application.
- **Zustand**: State management library.
- **`electron-store`**: Simple data persistence for Electron apps.
- **`recharts`**: Charting library for React.
- **`jspdf` and `jspdf-autotable`**: For generating PDF reports.
- **`xlsx/SheetJS`**: For generating Excel reports.
- **`pnpm`**: Package manager used across the monorepo.
- **`esbuild`**: Fast JavaScript bundler.