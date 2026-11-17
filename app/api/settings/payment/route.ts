import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface PaymentChannelConfig {
  enabled: boolean;
  accountName: string;
  accountNumber: string;
  customQrImageUrl: string | null;
  instructions?: string;
}

export interface StorePaymentSettings {
  merchantName: string;
  merchantSubtext: string;
  gcash: PaymentChannelConfig;
  maya: PaymentChannelConfig;
  codEnabled: boolean;
  payOnPickupEnabled: boolean;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: StorePaymentSettings = {
  merchantName: "OHMSIM ELECTRONICS LABS",
  merchantSubtext: "Region III Electrical & IoT Engineering Fulfillment",
  gcash: {
    enabled: true,
    accountName: "OHMSIM ELECTRONICS LABS",
    accountNumber: "0917 588 6467",
    customQrImageUrl: null,
    instructions: "Scan using GCash app or any QR Ph compliant banking app.",
  },
  maya: {
    enabled: true,
    accountName: "OHMSIM ELECTRONICS LABS",
    accountNumber: "0918 599 6292",
    customQrImageUrl: null,
    instructions: "Scan using Maya app or any QR Ph compliant banking app.",
  },
  codEnabled: true,
  payOnPickupEnabled: true,
  updatedAt: "2026-11-17T00:00:00.000Z",
};

// In-memory cache for fast server runtime responses
let cachedSettings: StorePaymentSettings = { ...DEFAULT_SETTINGS };

const STORAGE_FILE_PATH = path.join(process.cwd(), "tmp", "store-payment-settings.json");

function loadSettingsFromDisk(): StorePaymentSettings {
  try {
    if (fs.existsSync(STORAGE_FILE_PATH)) {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        gcash: { ...DEFAULT_SETTINGS.gcash, ...(parsed.gcash || {}) },
        maya: { ...DEFAULT_SETTINGS.maya, ...(parsed.maya || {}) },
      };
      return cachedSettings;
    }
  } catch (err) {
    console.error("Failed to read payment settings file:", err);
  }
  return cachedSettings;
}

function persistSettingsToDisk(settings: StorePaymentSettings): void {
  try {
    const dir = path.dirname(STORAGE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist payment settings to disk:", err);
  }
}

export async function GET() {
  const current = loadSettingsFromDisk();
  return NextResponse.json(current, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updated: StorePaymentSettings = {
      merchantName: String(body.merchantName || DEFAULT_SETTINGS.merchantName).trim(),
      merchantSubtext: String(body.merchantSubtext || DEFAULT_SETTINGS.merchantSubtext).trim(),
      gcash: {
        enabled: body.gcash?.enabled !== undefined ? Boolean(body.gcash.enabled) : true,
        accountName: String(body.gcash?.accountName || DEFAULT_SETTINGS.gcash.accountName).trim(),
        accountNumber: String(body.gcash?.accountNumber || DEFAULT_SETTINGS.gcash.accountNumber).trim(),
        customQrImageUrl: body.gcash?.customQrImageUrl || null,
        instructions: body.gcash?.instructions || DEFAULT_SETTINGS.gcash.instructions,
      },
      maya: {
        enabled: body.maya?.enabled !== undefined ? Boolean(body.maya.enabled) : true,
        accountName: String(body.maya?.accountName || DEFAULT_SETTINGS.maya.accountName).trim(),
        accountNumber: String(body.maya?.accountNumber || DEFAULT_SETTINGS.maya.accountNumber).trim(),
        customQrImageUrl: body.maya?.customQrImageUrl || null,
        instructions: body.maya?.instructions || DEFAULT_SETTINGS.maya.instructions,
      },
      codEnabled: body.codEnabled !== undefined ? Boolean(body.codEnabled) : true,
      payOnPickupEnabled: body.payOnPickupEnabled !== undefined ? Boolean(body.payOnPickupEnabled) : true,
      updatedAt: new Date().toISOString(),
    };

    cachedSettings = updated;
    persistSettingsToDisk(updated);

    return NextResponse.json({
      success: true,
      message: "Store payment settings updated successfully",
      settings: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
