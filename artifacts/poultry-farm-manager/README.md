# Poultry Farm Manager

Desktop application for managing poultry farms — built with Electron, React 18, TypeScript, Tailwind CSS, and SQLite.

## Prerequisites

- **Node.js v20 LTS** (download from https://nodejs.org)
- **pnpm** (install with `npm install -g pnpm`)
- **Windows**: Visual Studio Build Tools are required for native module compilation
  - Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - During installation, select **"Desktop development with C++"** workload
  - Alternatively, run: `npm install -g windows-build-tools` (from an admin terminal)

## Setup & Run

```bash
# 1. Install dependencies (automatically rebuilds native modules for Electron)
pnpm install

# 2. Run in development mode
pnpm run dev
```

That's it. The `postinstall` script automatically rebuilds `better-sqlite3` against Electron's Node.js version.

## Troubleshooting

### "better-sqlite3 was compiled against a different Node.js version"

This means the native module needs to be rebuilt for Electron. Run:

```bash
pnpm run rebuild
```

If that still fails, try deleting `node_modules` and reinstalling:

```bash
rm -rf node_modules
pnpm install
```

### Build Tools Not Found (Windows)

If you see errors about `MSBuild.exe` or `node-gyp`, install Visual Studio Build Tools:

1. Go to https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Download and run the installer
3. Select **"Desktop development with C++"**
4. Restart your terminal after installation

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start the Electron app in development mode |
| `pnpm run dev:web` | Start the web-only preview (no Electron) |
| `pnpm run build` | Build the app for production |
| `pnpm run dist` | Build and package as Windows installer (.exe) |
| `pnpm run rebuild` | Rebuild native modules for Electron |
| `pnpm run typecheck` | Run TypeScript type checking |

## Building the Windows Installer

```bash
pnpm run dist
```

This creates an NSIS `.exe` installer in the `release/` folder.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v3, React Router
- **Backend**: Electron (main process), better-sqlite3, Drizzle ORM
- **Build**: electron-vite, electron-builder
- **Auth**: bcryptjs, session-based with owner/farm/manager roles
