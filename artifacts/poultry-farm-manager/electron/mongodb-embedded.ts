import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { app } from "electron";
import { getMongoDBConfig } from "./mongodb-config";

let mongod: MongoMemoryServer | null = null;
let isConnected = false;
let connecting: Promise<void> | null = null;

async function startEmbeddedMongoDB(): Promise<string> {
  if (mongod) return mongod.getUri();

  const { dataDir, binaryDir, version } = getMongoDBConfig();

  console.log("[mongodb] Starting embedded MongoDB server...");
  console.log("[mongodb] Data directory:", dataDir);
  console.log("[mongodb] Binary directory:", binaryDir);

  // Configure mongodb-memory-server to use our binary location
  process.env.MONGOMS_DOWNLOAD_DIR = binaryDir;
  // In production, binaries should be bundled. Do not attempt downloads.
  if (app.isPackaged) {
    process.env.MONGOMS_DISABLE_POSTINSTALL = "1";
    process.env.MONGOMS_PREFER_GLOBAL_PATH = "1";
  }

  mongod = await MongoMemoryServer.create({
    instance: {
      dbPath: dataDir,
      storageEngine: "wiredTiger",
      port: 27777,
    },
    binary: {
      downloadDir: binaryDir,
      version,
      skipMD5: true,
    },
  });

  const uri = mongod.getUri();
  console.log("[mongodb] Embedded MongoDB started at:", uri);
  return uri;
}

async function stopEmbeddedMongoDB(): Promise<void> {
  if (!mongod) return;
  console.log("[mongodb] Stopping embedded MongoDB...");
  await mongod.stop();
  mongod = null;
  console.log("[mongodb] Embedded MongoDB stopped");
}

export async function connectMongoDB(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      let uri: string;

      if (process.env.MONGODB_URI) {
        uri = process.env.MONGODB_URI;
        console.log("[mongodb] Using MONGODB_URI from environment");
      } else if (!app.isPackaged) {
        // Development: try a local MongoDB first for speed
        try {
          uri = "mongodb://localhost:27017/poultry-farm";
          await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000,
            autoIndex: true,
          });
          isConnected = true;
          console.log("[mongodb] Connected to local MongoDB (development)");
          return;
        } catch {
          console.log("[mongodb] Local MongoDB not available, starting embedded...");
          uri = await startEmbeddedMongoDB();
        }
      } else {
        // Production: always use embedded
        uri = await startEmbeddedMongoDB();
      }

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30_000,
        connectTimeoutMS: 30_000,
        autoIndex: true,
      });
      isConnected = true;
      console.log("[mongodb] Connected successfully");
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("[mongodb] Disconnected from MongoDB");
    }
  } catch (error) {
    console.error("[mongodb] Error during disconnect:", error);
  } finally {
    await stopEmbeddedMongoDB();
    isConnected = false;
  }
}

export function isMongoDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

