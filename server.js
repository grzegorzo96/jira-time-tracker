'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const multer = require('multer');
const { createClient: createJiraClient } = require('./jira-client');

const PORT = process.env.PORT || 3847;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'tracker.db');
const SAMPLE_CSV = path.join(DATA_DIR, 'sample-jira-2026-09.csv');
const JIRA_CONFIG_PATH = path.join(DATA_DIR, 'jira-config.json');
const DEFAULT_JIRA_BASE = 'https://niteam.atlassian.net';
const DEFAULT_JIRA_EMAIL = 'grzegorz.osowski@netinteractive.pl';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
try { db.exec('PRAGMA journal_mode = WAL'); } catch (_) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_key TEXT NOT NULL DEFAULT '',
    issue_summary TEXT NOT NULL DEFAULT '',
    project_key TEXT NOT NULL DEFAULT '',
    started TEXT NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    worklog_id TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_entries_started ON entries(started);
  CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project_key);
`);
try {
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_worklog ON entries(worklog_id) WHERE worklog_id != ''`
  );
} catch (_) {}

function formatTimeSpent(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return '0m';
}

function parseDurationToSeconds(input) {
  if (input == null || input === '') return null;
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.round(input * 3600);
  }
  const str = String(input).trim().toLowerCase();
  if (!str) return null;

  // Pure number = hours (supports decimals)
  if (/^\d+([.,]\d+)?$/.test(str)) {
    return Math.round(parseFloat(str.replace(',', '.')) * 3600);
  }

  // hh:mm or h:mm
  const colon = str.match(/^(\d+):([0-5]?\d)$/);
  if (colon) {
    return parseInt(colon[1], 10) * 3600 + parseInt(colon[2], 10) * 60;
  }

  // Jira-like: 1h 30m, 2h, 45m
  let total = 0;
  const h = str.match(/(\d+)\s*h/);
  const m = str.match(/(\d+)\s*m/);
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (h || m) return total;

  return null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c && c.trim())).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] != null ? r[i] : '').trim();
    });
    return obj;
  });
}

function toCsvValue(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatStartedForCsv(started) {
  const s = String(started || '').trim();
  if (!s) return '';
  // Keep local date+time, drop timezone / Z / milliseconds noise.
  // Accepts: 2026-09-01T09:07:00.000+0200, 2026-09-01T09:07:00Z, 2026-09-01 09:07:00
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) return s;
  const sec = m[3] || '00';
  return `${m[1]} ${m[2]}:${sec}`;
}

function entryToCsvRow(e) {
  return [
    e.issue_key,
    e.issue_summary,
    e.project_key,
    formatStartedForCsv(e.started),
    formatTimeSpent(e.time_spent_seconds),
    e.author,
    e.comment,
  ].map(toCsvValue).join(',');
}

const CSV_HEADER =
  'issue_key,issue_summary,project_key,started,time_spent,author,comment';

function normalizeEntry(raw) {
  const seconds =
    raw.time_spent_seconds != null && String(raw.time_spent_seconds).trim() !== ''
      ? Math.round(Number(raw.time_spent_seconds))
      : parseDurationToSeconds(raw.time_spent || raw.duration);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error('Invalid duration / time_spent_seconds');
  }
  if (!raw.started) throw new Error('started is required');
  return {
    issue_key: raw.issue_key || '',
    issue_summary: raw.issue_summary || '',
    project_key: raw.project_key || '',
    started: raw.started,
    time_spent_seconds: seconds,
    author: raw.author || '',
    worklog_id: raw.worklog_id || '',
    comment: raw.comment || '',
  };
}

const insertStmt = db.prepare(`
  INSERT INTO entries
    (issue_key, issue_summary, project_key, started, time_spent_seconds, author, worklog_id, comment)
  VALUES
    (@issue_key, @issue_summary, @project_key, @started, @time_spent_seconds, @author, @worklog_id, @comment)
`);

const updateStmt = db.prepare(`
  UPDATE entries SET
    issue_key = @issue_key,
    issue_summary = @issue_summary,
    project_key = @project_key,
    started = @started,
    time_spent_seconds = @time_spent_seconds,
    author = @author,
    worklog_id = @worklog_id,
    comment = @comment,
    updated_at = datetime('now')
  WHERE id = @id
`);

const deleteStmt = db.prepare('DELETE FROM entries WHERE id = ?');
const getStmt = db.prepare('SELECT * FROM entries WHERE id = ?');

function monthBounds(month) {
  // month = YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('month must be YYYY-MM');
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return { start, next };
}


// --- Jira config (never log apiToken) ---

function readJiraConfig() {
  let raw = {};
  if (fs.existsSync(JIRA_CONFIG_PATH)) {
    try {
      raw = JSON.parse(fs.readFileSync(JIRA_CONFIG_PATH, 'utf8'));
    } catch (_) {
      raw = {};
    }
  }
  return {
    baseUrl: (raw.baseUrl && String(raw.baseUrl).trim()) || DEFAULT_JIRA_BASE,
    email: (raw.email && String(raw.email).trim()) || DEFAULT_JIRA_EMAIL,
    apiToken: raw.apiToken ? String(raw.apiToken) : '',
  };
}

function writeJiraConfig(cfg) {
  const out = {
    baseUrl: cfg.baseUrl || DEFAULT_JIRA_BASE,
    email: cfg.email || DEFAULT_JIRA_EMAIL,
    apiToken: cfg.apiToken || '',
  };
  fs.writeFileSync(JIRA_CONFIG_PATH, JSON.stringify(out, null, 2) + '\n', {
    mode: 0o600,
  });
  return out;
}

function jiraStatusPayload(cfg) {
  return {
    configured: !!(cfg.apiToken && cfg.baseUrl && cfg.email),
    baseUrl: cfg.baseUrl,
    email: cfg.email,
    hasToken: !!cfg.apiToken,
  };
}

function getJiraClientOrNull() {
  const cfg = readJiraConfig();
  if (!cfg.apiToken) return null;
  return createJiraClient(cfg);
}

const upsertByWorklogStmt = db.prepare(`
  UPDATE entries SET
    issue_key = @issue_key,
    issue_summary = @issue_summary,
    project_key = @project_key,
    started = @started,
    time_spent_seconds = @time_spent_seconds,
    author = @author,
    comment = @comment,
    updated_at = datetime('now')
  WHERE worklog_id = @worklog_id
`);

const findByWorklogStmt = db.prepare(
  'SELECT id FROM entries WHERE worklog_id = ? AND worklog_id != \'\''
);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(ROOT, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- API ---

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, entries: db.prepare('SELECT COUNT(*) AS c FROM entries').get().c });
});

app.get('/api/sample-info', (_req, res) => {
  res.json({
    available: fs.existsSync(SAMPLE_CSV),
    path: 'data/sample-jira-2026-09.csv',
    label: 'September 2026 sample (Jira)',
  });
});

app.post('/api/import', upload.single('file'), (req, res) => {
  try {
    let text;
    if (req.body && req.body.useSample === 'true') {
      if (!fs.existsSync(SAMPLE_CSV)) {
        return res.status(404).json({ error: 'Sample CSV not found' });
      }
      text = fs.readFileSync(SAMPLE_CSV, 'utf8');
    } else if (req.file) {
      text = req.file.buffer.toString('utf8');
    } else if (req.body && req.body.csv) {
      text = req.body.csv;
    } else {
      return res.status(400).json({ error: 'Provide a CSV file, csv body, or useSample=true' });
    }

    const rows = parseCsv(text);
    if (!rows.length) return res.status(400).json({ error: 'CSV has no data rows' });

    const replace = req.body && (req.body.replace === 'true' || req.body.replace === true);
    db.exec('BEGIN');
    try {
      if (replace) db.prepare('DELETE FROM entries').run();
      var imported = 0;
      for (const raw of rows) {
        const e = normalizeEntry(raw);
        insertStmt.run(e);
        imported++;
      }
      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      throw e;
    }
    const totalSeconds = db.prepare('SELECT COALESCE(SUM(time_spent_seconds),0) AS s FROM entries').get().s;
    res.json({
      imported,
      replaced: !!replace,
      totalSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.get('/api/export', (req, res) => {
  const month = req.query.month;
  let rows;
  if (month) {
    const { start, next } = monthBounds(month);
    rows = db
      .prepare(
        `SELECT * FROM entries
         WHERE substr(started,1,10) >= ? AND substr(started,1,10) < ?
         ORDER BY started ASC, id ASC`
      )
      .all(start, next);
  } else {
    rows = db.prepare('SELECT * FROM entries ORDER BY started ASC, id ASC').all();
  }
  const body = [CSV_HEADER, ...rows.map(entryToCsvRow)].join('\n') + '\n';
  const name = month ? `worklogs-${month}.csv` : 'worklogs-all.csv';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(body);
});

app.get('/api/dashboard', (req, res) => {
  try {
    const month = req.query.month;
    if (!month) return res.status(400).json({ error: 'month=YYYY-MM required' });
    const { start, next } = monthBounds(month);

    const entries = db
      .prepare(
        `SELECT * FROM entries
         WHERE substr(started,1,10) >= ? AND substr(started,1,10) < ?
         ORDER BY started DESC, id DESC`
      )
      .all(start, next);

    const totalSeconds = entries.reduce((a, e) => a + e.time_spent_seconds, 0);

    const byProjectMap = new Map();
    const byIssueMap = new Map();
    for (const e of entries) {
      const pk = e.project_key || '(none)';
      byProjectMap.set(pk, (byProjectMap.get(pk) || 0) + e.time_spent_seconds);
      const ik = e.issue_key || '(none)';
      const prev = byIssueMap.get(ik) || {
        issue_key: ik,
        issue_summary: e.issue_summary,
        project_key: e.project_key,
        seconds: 0,
      };
      prev.seconds += e.time_spent_seconds;
      if (e.issue_summary) prev.issue_summary = e.issue_summary;
      byIssueMap.set(ik, prev);
    }

    const byProject = [...byProjectMap.entries()]
      .map(([project_key, seconds]) => ({
        project_key,
        seconds,
        hours: Math.round((seconds / 3600) * 100) / 100,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    const topIssues = [...byIssueMap.values()]
      .map((x) => ({
        ...x,
        hours: Math.round((x.seconds / 3600) * 100) / 100,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10);

    // Spreadsheet day-grid: rows = tasks, columns = days of month
    const [yearNum, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Map issue_key -> { meta, secondsByDay[dayIndex0], totalSeconds }
    const gridMap = new Map();
    for (const e of entries) {
      const ik = e.issue_key || '(none)';
      let row = gridMap.get(ik);
      if (!row) {
        row = {
          issue_key: ik,
          issue_summary: e.issue_summary || '',
          project_key: e.project_key || '',
          secondsByDay: new Array(daysInMonth).fill(0),
          totalSeconds: 0,
        };
        gridMap.set(ik, row);
      }
      if (e.issue_summary) row.issue_summary = e.issue_summary;
      if (e.project_key) row.project_key = e.project_key;
      const dayMatch = String(e.started).match(/^\d{4}-\d{2}-(\d{2})/);
      const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : 0;
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        row.secondsByDay[dayNum - 1] += e.time_spent_seconds;
      }
      row.totalSeconds += e.time_spent_seconds;
    }

    const roundH = (sec) => Math.round((sec / 3600) * 100) / 100;

    const dayTotalsSeconds = new Array(daysInMonth).fill(0);
    const dayGrid = [...gridMap.values()]
      .map((row) => {
        row.secondsByDay.forEach((s, i) => {
          dayTotalsSeconds[i] += s;
        });
        return {
          issue_key: row.issue_key,
          issue_summary: row.issue_summary,
          project_key: row.project_key,
          hoursByDay: row.secondsByDay.map(roundH),
          secondsByDay: row.secondsByDay,
          totalSeconds: row.totalSeconds,
          totalHours: roundH(row.totalSeconds),
        };
      })
      .sort((a, b) => {
        const pa = (a.project_key || '').localeCompare(b.project_key || '', 'pl', { sensitivity: 'base' });
        if (pa !== 0) return pa;
        const ia = (a.issue_key || '').localeCompare(b.issue_key || '', 'pl', {
          sensitivity: 'base',
          numeric: true,
        });
        if (ia !== 0) return ia;
        return b.totalSeconds - a.totalSeconds;
      });

    const dayTotalsHours = dayTotalsSeconds.map(roundH);

    res.json({
      month,
      totalSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      entryCount: entries.length,
      byProject,
      topIssues,
      days,
      dayGrid,
      dayTotalsHours,
      dayTotalsSeconds,
      entries: entries.map((e) => ({
        ...e,
        time_spent: formatTimeSpent(e.time_spent_seconds),
        hours: Math.round((e.time_spent_seconds / 3600) * 100) / 100,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.get('/api/entries', (req, res) => {
  const month = req.query.month;
  let rows;
  if (month) {
    const { start, next } = monthBounds(month);
    rows = db
      .prepare(
        `SELECT * FROM entries
         WHERE substr(started,1,10) >= ? AND substr(started,1,10) < ?
         ORDER BY started DESC, id DESC`
      )
      .all(start, next);
  } else {
    rows = db.prepare('SELECT * FROM entries ORDER BY started DESC, id DESC').all();
  }
  res.json(
    rows.map((e) => ({
      ...e,
      time_spent: formatTimeSpent(e.time_spent_seconds),
      hours: Math.round((e.time_spent_seconds / 3600) * 100) / 100,
    }))
  );
});

app.get('/api/entries/:id', (req, res) => {
  const row = getStmt.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({
    ...row,
    time_spent: formatTimeSpent(row.time_spent_seconds),
    hours: Math.round((row.time_spent_seconds / 3600) * 100) / 100,
  });
});

app.post('/api/entries', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.duration != null && body.time_spent_seconds == null) {
      body.time_spent = body.duration;
    }
    // Push to Jira by default when configured, unless localOnly / "Tylko lokalnie"
    const localOnly = !!(body.localOnly || body.tylkoLokalnie);
    const client = getJiraClientOrNull();
    const pushToJira =
      !localOnly &&
      !!client &&
      (body.pushToJira !== false && body.syncToJira !== false);
    const e = normalizeEntry(body);

    if (pushToJira) {
      if (!e.issue_key) {
        return res.status(400).json({ error: 'issue_key is required to push to Jira' });
      }
      try {
        const wl = await client.addWorklog(e.issue_key, {
          timeSpentSeconds: e.time_spent_seconds,
          started: e.started,
          comment: e.comment,
        });
        e.worklog_id = wl && wl.id != null ? String(wl.id) : e.worklog_id;
        if (wl && wl.author && wl.author.displayName && !e.author) {
          e.author = wl.author.displayName;
        }
      } catch (jiraErr) {
        return res.status(502).json({
          error: `Jira worklog failed: ${jiraErr.message || String(jiraErr)}`,
        });
      }
    }

    // If author not set and we pushed, fill from Jira response / myself
    if (pushToJira && !e.author) {
      try {
        const me = await getMyselfCached(client);
        if (me && me.displayName) e.author = me.displayName;
      } catch (_) {}
    }

    const info = insertStmt.run(e);
    const row = getStmt.get(info.lastInsertRowid);
    let authorMismatch = false;
    let pushedAsAuthor = null;
    if (pushToJira && client) {
      try {
        const me = await getMyselfCached(client);
        pushedAsAuthor = me && me.displayName ? me.displayName : null;
        if (
          e.author &&
          pushedAsAuthor &&
          e.author.trim().toLowerCase() !== pushedAsAuthor.trim().toLowerCase()
        ) {
          authorMismatch = true;
        }
      } catch (_) {}
    }
    res.status(201).json({
      ...row,
      time_spent: formatTimeSpent(row.time_spent_seconds),
      hours: Math.round((row.time_spent_seconds / 3600) * 100) / 100,
      pushedToJira: pushToJira && !!row.worklog_id,
      authorMismatch,
      pushedAsAuthor,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getStmt.get(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const body = { ...existing, ...req.body, id };
    if (body.duration != null && req.body.time_spent_seconds == null) {
      body.time_spent = body.duration;
      delete body.time_spent_seconds;
    }
    const localOnly = !!(req.body && (req.body.localOnly || req.body.tylkoLokalnie));
    const e = normalizeEntry(body);
    // Preserve worklog_id from existing unless explicitly provided
    if (!e.worklog_id && existing.worklog_id) e.worklog_id = existing.worklog_id;

    const client = getJiraClientOrNull();
    let updatedInJira = false;
    if (!localOnly && client && e.worklog_id && e.issue_key) {
      try {
        await client.updateWorklog(e.issue_key, e.worklog_id, {
          timeSpentSeconds: e.time_spent_seconds,
          started: e.started,
          comment: e.comment,
        });
        updatedInJira = true;
      } catch (jiraErr) {
        return res.status(502).json({
          error: `Jira worklog update failed: ${jiraErr.message || String(jiraErr)}`,
        });
      }
    } else if (
      !localOnly &&
      client &&
      !e.worklog_id &&
      e.issue_key &&
      (req.body.pushToJira !== false)
    ) {
      // Local-only entry edited while Jira configured — create worklog
      try {
        const wl = await client.addWorklog(e.issue_key, {
          timeSpentSeconds: e.time_spent_seconds,
          started: e.started,
          comment: e.comment,
        });
        e.worklog_id = wl && wl.id != null ? String(wl.id) : '';
        updatedInJira = !!e.worklog_id;
      } catch (jiraErr) {
        return res.status(502).json({
          error: `Jira worklog failed: ${jiraErr.message || String(jiraErr)}`,
        });
      }
    }

    updateStmt.run({ ...e, id });
    const row = getStmt.get(id);
    res.json({
      ...row,
      time_spent: formatTimeSpent(row.time_spent_seconds),
      hours: Math.round((row.time_spent_seconds / 3600) * 100) / 100,
      updatedInJira,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getStmt.get(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // If linked to Jira, delete remote worklog first; keep local on failure
    if (existing.worklog_id && existing.issue_key) {
      const client = getJiraClientOrNull();
      if (client) {
        try {
          await client.deleteWorklog(existing.issue_key, existing.worklog_id);
        } catch (jiraErr) {
          // 404 on Jira = already gone — treat as ok and proceed with local delete
          if (!(jiraErr.status === 404)) {
            return res.status(502).json({
              error: `Jira worklog delete failed: ${jiraErr.message || String(jiraErr)}`,
              keptLocal: true,
            });
          }
        }
      }
    }

    const info = deleteStmt.run(id);
    if (!info.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id, deletedFromJira: !!(existing.worklog_id) });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});


// --- Jira sync API ---

// Light in-memory cache for project issues (TTL 2 min)
const issuesCache = new Map(); // projectKey -> { at, issues }
const ISSUES_CACHE_TTL_MS = 2 * 60 * 1000;
let myselfCache = { at: 0, data: null };
const MYSELF_CACHE_TTL_MS = 5 * 60 * 1000;

async function getMyselfCached(client) {
  const now = Date.now();
  if (myselfCache.data && now - myselfCache.at < MYSELF_CACHE_TTL_MS) {
    return myselfCache.data;
  }
  const me = await client.getMyself();
  const data = {
    displayName: me.displayName || '',
    accountId: me.accountId || '',
    email: me.emailAddress || '',
  };
  myselfCache = { at: now, data };
  return data;
}

app.get('/api/jira/status', async (_req, res) => {
  const cfg = readJiraConfig();
  const payload = jiraStatusPayload(cfg);
  const client = getJiraClientOrNull();
  if (client) {
    try {
      payload.myself = await getMyselfCached(client);
    } catch (err) {
      payload.myself = null;
      payload.myselfError = err.message || String(err);
    }
  } else {
    payload.myself = null;
  }
  res.json(payload);
});

app.get('/api/jira/myself', async (_req, res) => {
  try {
    const client = getJiraClientOrNull();
    if (!client) {
      return res.status(400).json({
        error: 'Jira not configured — set API token in settings',
        configured: false,
      });
    }
    const myself = await getMyselfCached(client);
    res.json(myself);
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? 502 : 400;
    res.status(status).json({ error: err.message || String(err) });
  }
});

app.put('/api/jira/config', (req, res) => {
  try {
    const current = readJiraConfig();
    const body = req.body || {};
    const next = {
      baseUrl:
        body.baseUrl != null && String(body.baseUrl).trim() !== ''
          ? String(body.baseUrl).trim().replace(/\/+$/, '')
          : current.baseUrl,
      email:
        body.email != null && String(body.email).trim() !== ''
          ? String(body.email).trim()
          : current.email,
      apiToken: current.apiToken,
    };
    // Empty apiToken string means keep existing token
    if (body.apiToken != null && String(body.apiToken) !== '') {
      next.apiToken = String(body.apiToken);
    }
    writeJiraConfig(next);
    res.json(jiraStatusPayload(next));
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

app.get('/api/jira/projects', async (_req, res) => {
  try {
    const client = getJiraClientOrNull();
    if (!client) {
      return res.status(400).json({
        error: 'Jira not configured — set API token in settings',
        configured: false,
        projects: [],
      });
    }
    const projects = await client.listProjects();
    res.json({ projects, count: projects.length });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? 502 : 400;
    res.status(status).json({ error: err.message || String(err), projects: [] });
  }
});

app.get('/api/jira/issues', async (req, res) => {
  try {
    const project =
      (req.query.project && String(req.query.project).trim()) ||
      (req.query.projectKey && String(req.query.projectKey).trim()) ||
      '';
    if (!project) {
      return res.status(400).json({ error: 'project=KEY required', issues: [] });
    }
    const client = getJiraClientOrNull();
    if (!client) {
      return res.status(400).json({
        error: 'Jira not configured — set API token in settings',
        configured: false,
        issues: [],
      });
    }
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const now = Date.now();
    const cached = issuesCache.get(project);
    if (!refresh && cached && now - cached.at < ISSUES_CACHE_TTL_MS) {
      return res.json({
        project,
        issues: cached.issues,
        count: cached.issues.length,
        cached: true,
      });
    }
    const cap = Math.min(
      Math.max(parseInt(req.query.cap, 10) || 400, 1),
      500
    );
    const issues = await client.searchIssuesByProject(project, { cap });
    issuesCache.set(project, { at: now, issues });
    res.json({ project, issues, count: issues.length, cached: false });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? 502 : 400;
    res.status(status).json({ error: err.message || String(err), issues: [] });
  }
});

app.get('/api/jira/users', async (req, res) => {
  try {
    const client = getJiraClientOrNull();
    if (!client) {
      return res.status(400).json({
        error: 'Jira not configured — set API token in settings',
        configured: false,
        users: [],
      });
    }
    const project =
      (req.query.project && String(req.query.project).trim()) ||
      (req.query.projectKey && String(req.query.projectKey).trim()) ||
      '';
    const query = req.query.query != null ? String(req.query.query) : '';
    let users;
    if (project) {
      users = await client.searchAssignableUsers(project, query, {
        maxResults: 50,
      });
    } else {
      // Jira often needs ≥1 char; '.' or domain fragment works for many tenants
      const q = query.trim() || '.';
      users = await client.searchUsers(q, { maxResults: 50 });
    }
    // Prefer active users; keep myself first if present
    let myself = null;
    try {
      myself = await getMyselfCached(client);
    } catch (_) {}
    users = (users || []).filter((u) => u.active !== false);
    if (myself && myself.accountId) {
      const rest = users.filter((u) => u.accountId !== myself.accountId);
      const meInList = users.find((u) => u.accountId === myself.accountId);
      users = [
        meInList || {
          accountId: myself.accountId,
          displayName: myself.displayName,
          emailAddress: myself.email,
          active: true,
        },
        ...rest,
      ];
    }
    res.json({ users, count: users.length, project: project || null });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? 502 : 400;
    res.status(status).json({ error: err.message || String(err), users: [] });
  }
});

app.post('/api/jira/pull', async (req, res) => {
  try {
    const month = (req.body && req.body.month) || req.query.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month=YYYY-MM required' });
    }
    const client = getJiraClientOrNull();
    if (!client) {
      return res.status(400).json({
        error: 'Jira not configured — set API token in settings',
        configured: false,
      });
    }

    const { entries, issueCount } = await client.fetchMyWorklogsForMonth(month);
    const { start, next } = monthBounds(month);
    let imported = 0;
    let updated = 0;
    const pulledIds = [];

    db.exec('BEGIN');
    try {
      for (const e of entries) {
        if (!e.worklog_id) continue;
        pulledIds.push(e.worklog_id);
        const existing = findByWorklogStmt.get(e.worklog_id);
        if (existing) {
          upsertByWorklogStmt.run(e);
          updated++;
        } else {
          insertStmt.run(e);
          imported++;
        }
      }

      // Remove Jira-backed entries for this month that were not in the pull
      let removed = 0;
      if (pulledIds.length) {
        const placeholders = pulledIds.map(() => '?').join(',');
        const del = db.prepare(
          `DELETE FROM entries
           WHERE worklog_id != ''
             AND substr(started,1,10) >= ?
             AND substr(started,1,10) < ?
             AND worklog_id NOT IN (${placeholders})`
        );
        const info = del.run(start, next, ...pulledIds);
        removed = info.changes || 0;
      } else {
        // No worklogs from Jira — remove all Jira-synced entries in month (keep local-only)
        const info = db
          .prepare(
            `DELETE FROM entries
             WHERE worklog_id != ''
               AND substr(started,1,10) >= ?
               AND substr(started,1,10) < ?`
          )
          .run(start, next);
        removed = info.changes || 0;
      }
      db.exec('COMMIT');

      const totalSeconds = db
        .prepare(
          `SELECT COALESCE(SUM(time_spent_seconds),0) AS s FROM entries
           WHERE substr(started,1,10) >= ? AND substr(started,1,10) < ?`
        )
        .get(start, next).s;

      res.json({
        ok: true,
        imported,
        updated,
        removed,
        totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
        issueCount,
      });
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      throw e;
    }
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? 502 : 400;
    res.status(status).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Jira Time Tracker running at http://127.0.0.1:${PORT}`);
  console.log(`SQLite DB: ${DB_PATH}`);
  console.log(`Sample CSV: ${SAMPLE_CSV}`);
});
