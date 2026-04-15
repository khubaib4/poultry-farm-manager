import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/poultry-farm";

let isConnected = false;
let connecting: Promise<typeof mongoose> | null = null;

function logStatus(message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.log(`[mongodb] ${message}`, extra);
  } else {
    console.log(`[mongodb] ${message}`);
  }
}

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      mongoose.connection.on("connected", () => {
        isConnected = true;
        logStatus("connected");
      });
      mongoose.connection.on("disconnected", () => {
        isConnected = false;
        logStatus("disconnected");
      });
      mongoose.connection.on("reconnected", () => {
        isConnected = true;
        logStatus("reconnected");
      });
      mongoose.connection.on("error", (err) => {
        isConnected = false;
        logStatus("error", err);
      });

      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      });

      isConnected = mongoose.connection.readyState === 1;
      return mongoose;
    } catch (err) {
      isConnected = false;
      logStatus("failed to connect", err);
      throw err;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState === 0) {
      isConnected = false;
      return;
    }
    await mongoose.disconnect();
    isConnected = false;
    logStatus("disconnected (explicit)");
  } catch (err) {
    logStatus("failed to disconnect", err);
    throw err;
  }
}

export function getMongoConnection(): typeof mongoose {
  return mongoose;
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

