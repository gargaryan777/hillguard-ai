"use client";

import Dexie, { type Table } from "dexie";

export interface OfflineReport {
  id?: number;
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
  timestamp: number;
  synced: boolean;
  serverId?: string;
  imageBlob?: Blob;
}

export interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
}

export class HillguardDB extends Dexie {
  reports!: Table<OfflineReport, number>;
  cache!: Table<CachedData, string>;

  constructor() {
    super("HillguardDB");
    this.version(1).stores({
      reports: "++id, latitude, longitude, description, severity, timestamp, synced",
      cache: "key, timestamp",
    });
  }
}

export const db = new HillguardDB();

export async function saveReportOffline(
  report: Omit<OfflineReport, "id" | "synced">
): Promise<number> {
  return db.reports.add({ ...report, synced: false });
}

export async function getUnsyncedReports(): Promise<OfflineReport[]> {
  return db.reports.where("synced").equals(0).toArray();
}

export async function markReportSynced(id: number, serverId?: string): Promise<void> {
  await db.reports.update(id, { synced: true, serverId });
}

export async function cacheAPIData(
  key: string,
  data: unknown,
  ttlMs: number = 5 * 60 * 1000
): Promise<void> {
  await db.cache.put({ key, data, timestamp: Date.now() + ttlMs });
}

export async function getCachedAPIData<T>(
  key: string,
  ttlMs: number = 5 * 60 * 1000
): Promise<T | null> {
  const entry = await db.cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.timestamp + ttlMs) {
    await db.cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function syncOfflineReports(): Promise<{
  synced: number;
  failed: number;
}> {
  const unsynced = await getUnsyncedReports();
  if (unsynced.length === 0) return { synced: 0, failed: 0 };

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const payload = unsynced.map((r) => ({
      latitude: r.latitude,
      longitude: r.longitude,
      description: r.description,
      severity: r.severity,
      created_at: new Date(r.timestamp).toISOString(),
    }));

    const res = await fetch(`${API_BASE}/api/reports/bulk-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reports: payload }),
    });

    if (res.ok) {
      const result = await res.json();
      for (const report of unsynced) {
        if (report.id) await markReportSynced(report.id);
      }
      return { synced: result.synced || unsynced.length, failed: result.failed || 0 };
    }
  } catch {
    // Fall back to individual sync
  }

  let synced = 0;
  let failed = 0;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  for (const report of unsynced) {
    try {
      const res = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: report.latitude,
          longitude: report.longitude,
          description: report.description,
          severity: report.severity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (report.id) await markReportSynced(report.id, data.report?.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export async function getOfflineReportCount(): Promise<number> {
  return db.reports.where("synced").equals(0).count();
}
