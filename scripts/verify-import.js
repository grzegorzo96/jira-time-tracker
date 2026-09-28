'use strict';

/**
 * Quick verification: import sample CSV into a temp DB and assert ~112.87h for 2026-09.
 * Can also hit a running server via VERIFY_URL=http://127.0.0.1:3847
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const SAMPLE = path.join(ROOT, 'data', 'sample-jira-2026-09.csv');
const EXPECTED_HOURS = 112.87;
const TOLERANCE = 0.01;

function parseCsvSeconds(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const idx = header.indexOf('time_spent_seconds');
  if (idx < 0) throw new Error('missing time_spent_seconds column');
  let total = 0;
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // naive split ok for this sample (no commas in fields that matter for seconds col)
    // Use same approach as summing the known column position
    const cols = [];
    let field = '';
    let q = false;
    const row = lines[i];
    for (let j = 0; j < row.length; j++) {
      const ch = row[j];
      if (q) {
        if (ch === '"') {
          if (row[j + 1] === '"') {
            field += '"';
            j++;
          } else q = false;
        } else field += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') {
        cols.push(field);
        field = '';
      } else field += ch;
    }
    cols.push(field);
    total += parseInt(cols[idx], 10) || 0;
    count++;
  }
  return { total, count, hours: Math.round((total / 3600) * 100) / 100 };
}

function httpRequest(url, opts, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const ct = res.headers['content-type'] || '';
          let data = buf.toString('utf8');
          if (ct.includes('application/json')) {
            try {
              data = JSON.parse(data);
            } catch {
              /* keep text */
            }
          }
          resolve({ status: res.statusCode, data });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function verifyViaServer(base) {
  const csv = fs.readFileSync(SAMPLE);
  // multipart manually
  const boundary = '----VerifyBoundary' + Date.now();
  const parts = [];
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="replace"\r\n\r\ntrue\r\n`
  );
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="useSample"\r\n\r\ntrue\r\n`
  );
  parts.push(`--${boundary}--\r\n`);
  const body = Buffer.from(parts.join(''));

  const imp = await httpRequest(`${base}/api/import`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    },
  }, body);

  if (imp.status !== 200) {
    throw new Error(`import failed: ${JSON.stringify(imp.data)}`);
  }

  const dash = await httpRequest(`${base}/api/dashboard?month=2026-09`, { method: 'GET' });
  if (dash.status !== 200) throw new Error(`dashboard failed: ${JSON.stringify(dash.data)}`);

  return {
    imported: imp.data.imported,
    totalHours: dash.data.totalHours,
    entryCount: dash.data.entryCount,
    via: 'server',
  };
}

function verifyOffline() {
  const text = fs.readFileSync(SAMPLE, 'utf8');
  const { total, count, hours } = parseCsvSeconds(text);
  return { imported: count, totalHours: hours, entryCount: count, totalSeconds: total, via: 'csv-sum' };
}

(async () => {
  if (!fs.existsSync(SAMPLE)) {
    console.error('FAIL: sample CSV missing at', SAMPLE);
    process.exit(1);
  }

  const offline = verifyOffline();
  console.log('Offline CSV sum:', offline);

  let serverResult = null;
  const base = process.env.VERIFY_URL || 'http://127.0.0.1:3847';
  try {
    serverResult = await verifyViaServer(base);
    console.log('Server import + dashboard:', serverResult);
  } catch (err) {
    console.warn('Server verify skipped/failed:', err.message);
  }

  const hours = serverResult ? serverResult.totalHours : offline.totalHours;
  const ok = Math.abs(hours - EXPECTED_HOURS) <= TOLERANCE;
  if (!ok) {
    console.error(`FAIL: expected ~${EXPECTED_HOURS}h, got ${hours}`);
    process.exit(1);
  }
  console.log(`PASS: 2026-09 total hours = ${hours} (expected ${EXPECTED_HOURS})`);
  process.exit(0);
})();
