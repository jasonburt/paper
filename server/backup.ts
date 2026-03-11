import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = process.env.BACKUP_BUCKET || 'paper-db';
const DB_PATH = process.env.NODE_ENV === 'production' ? '/tmp/paper.db' : path.join(path.dirname(new URL(import.meta.url).pathname), 'paper.db');

let storage: Storage;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
}

function getBackupKey(label?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = label ? `-${label}` : '';
  return `backups/paper-${timestamp}${suffix}.db`;
}

/** Upload the current DB file to GCS */
export async function backupToGCS(label?: string): Promise<string> {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`DB file not found at ${DB_PATH}`);
  }
  const bucket = getStorage().bucket(BUCKET_NAME);
  const key = getBackupKey(label);

  // Upload timestamped copy
  await bucket.upload(DB_PATH, { destination: key });

  // Also upload as "latest" for easy restore
  await bucket.upload(DB_PATH, { destination: 'backups/paper-latest.db' });

  console.log(`[backup] Uploaded to gs://${BUCKET_NAME}/${key}`);
  return key;
}

/** Download the latest backup from GCS and write it to the DB path */
export async function restoreFromGCS(): Promise<boolean> {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file('backups/paper-latest.db');

  const [exists] = await file.exists();
  if (!exists) {
    console.log('[backup] No backup found in GCS, starting fresh');
    return false;
  }

  await file.download({ destination: DB_PATH });
  console.log(`[backup] Restored from gs://${BUCKET_NAME}/backups/paper-latest.db`);
  return true;
}

/** List recent backups */
export async function listBackups(limit = 20): Promise<string[]> {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const [files] = await bucket.getFiles({ prefix: 'backups/paper-', maxResults: limit });
  return files
    .map(f => f.name)
    .filter(name => name !== 'backups/paper-latest.db')
    .sort()
    .reverse();
}

/** Start hourly backup interval. Returns the timer handle. */
export function startHourlyBackup(): NodeJS.Timeout {
  const ONE_HOUR = 60 * 60 * 1000;
  console.log('[backup] Hourly backup enabled');
  return setInterval(async () => {
    try {
      await backupToGCS('hourly');
      console.log('[backup] Hourly backup complete');
    } catch (err) {
      console.error('[backup] Hourly backup failed:', err);
    }
  }, ONE_HOUR);
}
