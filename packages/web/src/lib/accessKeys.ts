import crypto from "crypto";

export function hashAccessKey(rawKey: string): string {
  const pepper = process.env.ACCESS_KEY_PEPPER;
  if (!pepper) {
    throw new Error("ACCESS_KEY_PEPPER environment variable is missing");
  }

  return crypto.createHmac("sha256", pepper).update(rawKey).digest("hex");
}

export function generateAccessKey(): { rawKey: string; hashedKey: string } {
  const rawKey = crypto.randomBytes(32).toString("hex");

  const hashedKey = hashAccessKey(rawKey);

  return { rawKey, hashedKey };
}
