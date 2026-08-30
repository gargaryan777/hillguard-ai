import Dexie, { Table } from 'dexie';

export interface OfflineReport {
  id?: number;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: number;
  synced: boolean;
}

export class HillguardDatabase extends Dexie {
  reports!: Table<OfflineReport, number>;

  constructor() {
    super('HillguardDB');
    this.version(1).stores({
      reports: '++id, latitude, longitude, description, timestamp, synced'
    });
  }
}

export const db = new HillguardDatabase();
