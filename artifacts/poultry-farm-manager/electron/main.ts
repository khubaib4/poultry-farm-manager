import { app, BrowserWindow, dialog, shell } from "electron";
import { join } from "path";
import { connectMongoDB, disconnectMongoDB } from "./mongodb-embedded";
import { registerIpcHandlers } from "./ipc-handlers-mongo";
import { initAutoBackup } from "./autoBackup";
import { startBackgroundSync } from "./sync-service";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Poultry Farm Manager",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.cjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    await connectMongoDB();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown MongoDB connection error";
    await dialog.showMessageBox({
      type: "error",
      title: "Database Connection Failed",
      message: "Could not connect to the local database.",
      detail:
        "Please make sure the local MongoDB service is running, then restart the app.\n\n" +
        message,
    });
    app.quit();
    return;
  }

  registerIpcHandlers();
  initAutoBackup();
  startBackgroundSync();

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void disconnectMongoDB();
});
