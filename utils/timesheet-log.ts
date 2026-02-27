/**
 * Append-only NDJSON file log for timesheet operations.
 *
 * Every clock-in, clock-out, edit, admin approval/rejection, and
 * bulk verification is appended as a single JSON line to:
 *   <project-root>/logs/timesheet-audit.ndjson
 *
 * This file is completely independent of Supabase and can be used
 * to reconstruct timesheet history if the database is lost or corrupted.
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

function dailyLogFile(): string {
  const date = new Date().toISOString().slice(0, 10); // e.g. "2026-02-27"
  return path.join(LOG_DIR, `timesheet-audit-${date}.ndjson`);
}

export type TimesheetLogEntry =
  | { op: 'clock_in';              timesheetId: string; userId: string; companyName?: string; clockIn: string }
  | { op: 'clock_out';             timesheetId: string; userId: string; companyName?: string; clockOut: string }
  | { op: 'timesheet_edit';        timesheetId: string; userId: string; clockIn: string; clockOut: string | null }
  | { op: 'timesheets_verified';   timesheetIds: string[]; adminId: string }
  | { op: 'request_approved';      requestId: string; type: 'create' | 'update' | 'delete'; timesheetId?: string | null; userId: string; adminId: string; clockIn?: string | null; clockOut?: string | null }
  | { op: 'request_rejected';      requestId: string; type: 'create' | 'update' | 'delete'; timesheetId?: string | null; userId: string; adminId: string; notes?: string | null };

export function appendTimesheetLog(entry: TimesheetLogEntry): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(dailyLogFile(), line, 'utf8');
  } catch (err) {
    // Log failures must never break the main operation.
    console.error('[timesheet-log] Failed to write audit log entry:', err);
  }
}
