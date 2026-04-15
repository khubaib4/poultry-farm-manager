const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");

async function downloadMongoDB() {
  console.log("Downloading MongoDB binaries for bundling...");

  const downloadDir = path.join(__dirname, "..", "mongodb-binaries");

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log("Download directory:", downloadDir);

  process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

  try {
    const mongod = await MongoMemoryServer.create({
      binary: {
        downloadDir,
        version: "6.0.12",
      },
      instance: {
        // Use a temp DB path; this is just for binary download
        dbPath: path.join(downloadDir, "__tmpdb"),
      },
    });

    console.log("MongoDB binaries downloaded successfully!");
    console.log("Binary path:", await mongod.getInstancePath());

    await mongod.stop();

    try {
      fs.rmSync(path.join(downloadDir, "__tmpdb"), { recursive: true, force: true });
    } catch {}

    console.log("\nBinaries are ready for bundling in:", downloadDir);
    console.log("Include this folder in your electron-builder extraResources.");
  } catch (error) {
    console.error("Failed to download MongoDB:", error);
    process.exit(1);
  }
}

downloadMongoDB();

