import path from "path";
import { app } from "electron";
import fs from "fs";

export function getMongoDBConfig(): { binaryDir: string; dataDir: string; version: string } {
  const isPackaged = app.isPackaged;

  const binaryDir = isPackaged
    ? path.join(process.resourcesPath, "mongodb-binaries")
    : path.join(app.getPath("userData"), "mongodb-binaries");

  const dataDir = path.join(app.getPath("userData"), "mongodb-data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(binaryDir)) {
    fs.mkdirSync(binaryDir, { recursive: true });
  }

  return {
    binaryDir,
    dataDir,
    version: "6.0.12",
  };
}

export function getMongoDataPath(): string {
  const dataPath = path.join(app.getPath("userData"), "mongodb-data");
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  return dataPath;
}

