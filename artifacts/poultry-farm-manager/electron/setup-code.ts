import crypto from "crypto";

/** Prefer `SETUP_CODE_SECRET` in production builds. */
const SECRET_KEY = process.env.SETUP_CODE_SECRET ?? "poultry-farm-setup-2024-secure-key";

export interface SetupCodeData {
  atlasUri: string;
  farmId: number;
  ownerId: number;
  farmName: string;
  expiresAt: string;
  createdAt: string;
}

function encrypt(data: string): string {
  const key = crypto.scryptSync(SECRET_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const [ivBase64, encrypted] = encryptedData.split(":");
  if (!ivBase64 || encrypted == null) {
    throw new Error("Invalid encrypted payload");
  }
  const key = crypto.scryptSync(SECRET_KEY, "salt", 32);
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateSetupCode(
  atlasUri: string,
  farmId: number,
  ownerId: number,
  farmName: string,
  expiryDays: number = 7
): { code: string; expiresAt: string } {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const data: SetupCodeData = {
    atlasUri,
    farmId,
    ownerId,
    farmName,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const jsonData = JSON.stringify(data);
  const encrypted = encrypt(jsonData);

  const code =
    "PF-" +
    Buffer.from(encrypted, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return { code, expiresAt: expiresAt.toISOString() };
}

export function parseSetupCode(code: string): {
  valid: boolean;
  data?: SetupCodeData;
  error?: string;
} {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith("PF-")) {
      return { valid: false, error: "Invalid setup code format" };
    }

    let base64 = trimmed.substring(3).replace(/-/g, "+").replace(/_/g, "/");
    base64 += "=".repeat((4 - (base64.length % 4)) % 4);
    const encrypted = Buffer.from(base64, "base64").toString("utf8");

    const jsonData = decrypt(encrypted);
    const data = JSON.parse(jsonData) as SetupCodeData;

    const expiryDate = new Date(data.expiresAt);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      return { valid: false, error: "Setup code has expired" };
    }

    if (
      typeof data.atlasUri !== "string" ||
      !data.atlasUri.trim() ||
      typeof data.farmId !== "number" ||
      typeof data.ownerId !== "number"
    ) {
      return { valid: false, error: "Invalid setup code data" };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: `Failed to parse setup code: ${String(error)}` };
  }
}

export function isValidSetupCodeFormat(code: string): boolean {
  return code.trim().startsWith("PF-") && code.trim().length > 50;
}
