import fs from "fs";
import path from "path";
import archiver from "archiver";
import extract from "extract-zip";
import { app, shell } from "electron";
import * as Models from "./models";

export interface BackupMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  collections: string[];
  recordCounts: Record<string, number>;
}

export interface BackupResult {
  success: boolean;
  error?: string;
  path?: string;
  metadata?: BackupMetadata;
}

type CollectionDef = { name: string; model: { find: Function; deleteMany: Function; insertMany: Function } };

const COLLECTIONS: CollectionDef[] = [
  { name: "owners", model: Models.OwnerModel as any },
  { name: "farms", model: Models.FarmModel as any },
  { name: "users", model: Models.UserModel as any },
  { name: "flocks", model: Models.FlockModel as any },
  { name: "dailyEntries", model: Models.DailyEntryModel as any },
  { name: "customers", model: Models.CustomerModel as any },
  { name: "sales", model: Models.SaleModel as any },
  { name: "saleItems", model: Models.SaleItemModel as any },
  { name: "salePayments", model: Models.SalePaymentModel as any },
  { name: "expenses", model: Models.ExpenseModel as any },
  { name: "inventory", model: Models.InventoryModel as any },
  { name: "inventoryTransactions", model: Models.InventoryTransactionModel as any },
  { name: "vaccinations", model: Models.VaccinationModel as any },
  { name: "vaccinationSchedules", model: Models.VaccinationScheduleModel as any },
  { name: "vaccines", model: Models.VaccineModel as any },
  { name: "eggPrices", model: Models.EggPriceModel as any },
  { name: "dismissedAlerts", model: Models.DismissedAlertModel as any },
  { name: "counters", model: Models.CounterModel as any },
];

export function getBackupDirectory(): string {
  return path.join(app.getPath("documents"), "PoultryFarmBackups");
}

export async function createBackup(backupPath?: string): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const defaultPath = path.join(getBackupDirectory(), `backup-${timestamp}.zip`);
  const targetPath = backupPath || defaultPath;
  const tempDir = path.join(app.getPath("temp"), `poultry-backup-${Date.now()}`);

  try {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.mkdir(tempDir, { recursive: true });

    const recordCounts: Record<string, number> = {};
    for (const { name, model } of COLLECTIONS) {
      const docs = await (model as any).find({}).lean();
      recordCounts[name] = Array.isArray(docs) ? docs.length : 0;
      await fs.promises.writeFile(path.join(tempDir, `${name}.json`), JSON.stringify(docs ?? [], null, 2), "utf-8");
    }

    const metadata: BackupMetadata = {
      version: "2.0",
      createdAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      collections: COLLECTIONS.map((c) => c.name),
      recordCounts,
    };
    await fs.promises.writeFile(path.join(tempDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf-8");

    await zipDirectory(tempDir, targetPath);

    await fs.promises.rm(tempDir, { recursive: true, force: true });
    return { success: true, path: targetPath, metadata };
  } catch (error) {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function restoreBackup(backupPath: string): Promise<BackupResult> {
  const validation = await validateBackup(backupPath);
  if (!validation.valid) return { success: false, error: validation.error };

  const tempDir = path.join(app.getPath("temp"), `poultry-restore-${Date.now()}`);

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    await extract(backupPath, { dir: tempDir });

    for (const { name, model } of COLLECTIONS) {
      const jsonPath = path.join(tempDir, `${name}.json`);
      if (!fs.existsSync(jsonPath)) continue;
      const raw = await fs.promises.readFile(jsonPath, "utf-8");
      const data = JSON.parse(raw);

      await (model as any).deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        await (model as any).insertMany(data, { ordered: false });
      }
    }

    const metadataPath = path.join(tempDir, "metadata.json");
    const metadata: BackupMetadata | undefined = fs.existsSync(metadataPath)
      ? JSON.parse(await fs.promises.readFile(metadataPath, "utf-8"))
      : undefined;

    await fs.promises.rm(tempDir, { recursive: true, force: true });
    return { success: true, metadata };
  } catch (error) {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function validateBackup(
  backupPath: string
): Promise<{ valid: boolean; error?: string; metadata?: BackupMetadata }> {
  if (!fs.existsSync(backupPath)) return { valid: false, error: "Backup file not found" };

  const tempDir = path.join(app.getPath("temp"), `poultry-validate-${Date.now()}`);
  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    await extract(backupPath, { dir: tempDir });

    const metadataPath = path.join(tempDir, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      return { valid: false, error: "Invalid backup: missing metadata.json" };
    }
    const metadata: BackupMetadata = JSON.parse(await fs.promises.readFile(metadataPath, "utf-8"));

    for (const collection of metadata.collections ?? []) {
      const jsonPath = path.join(tempDir, `${collection}.json`);
      if (!fs.existsSync(jsonPath)) {
        return { valid: false, error: `Invalid backup: missing ${collection}.json` };
      }
    }

    return { valid: true, metadata };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

export async function listBackups(): Promise<Array<{ path: string; filename: string; createdAt: string; size: number }>> {
  try {
    const backupDir = getBackupDirectory();
    if (!fs.existsSync(backupDir)) return [];
    const files = await fs.promises.readdir(backupDir);

    const backups: Array<{ path: string; filename: string; createdAt: string; size: number }> = [];
    for (const file of files) {
      if (!file.endsWith(".zip")) continue;
      const filePath = path.join(backupDir, file);
      const stats = await fs.promises.stat(filePath);
      backups.push({
        path: filePath,
        filename: file,
        createdAt: stats.mtime.toISOString(),
        size: stats.size,
      });
    }
    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function openBackupFolder(): Promise<void> {
  const dir = getBackupDirectory();
  await fs.promises.mkdir(dir, { recursive: true });
  void shell.openPath(dir);
}

function isBackupPathAllowed(backupPath: string): boolean {
  try {
    const resolved = path.resolve(backupPath);
    const backupDir = path.resolve(getBackupDirectory());
    return resolved.startsWith(backupDir + path.sep) || resolved === backupDir;
  } catch {
    return false;
  }
}

export async function deleteBackupFile(backupPath: string): Promise<void> {
  if (!backupPath || !backupPath.endsWith(".zip")) throw new Error("Invalid backup file");
  if (!isBackupPathAllowed(backupPath)) throw new Error("Backup path is outside backup directory");
  if (!fs.existsSync(backupPath)) return;
  await fs.promises.unlink(backupPath);
}

async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}

