'use strict';

/**
 * Minimal Jira Cloud REST API v3 client (Basic auth: email:apiToken).
 * Never log the apiToken.
 */

function basicAuthHeader(email, apiToken) {
  const token = Buffer.from(`${email}:${apiToken}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

function lastDayOfMonth(month) {
  // month = YYYY-MM
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${month}-${String(d).padStart(2, '0')}`;
}

function monthDateRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('month must be YYYY-MM');
  return {
    start: `${month}-01`,
    end: lastDayOfMonth(month),
  };
}

/** Extract YYYY-MM-DD from Jira started string */
function startedDateOnly(started) {
  const m = String(started || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function isInMonth(started, month) {
  const d = startedDateOnly(started);
  return d.startsWith(month);
}

/** Flatten ADF or plain comment to string */
function commentToText(comment) {
  if (comment == null) return '';
  if (typeof comment === 'string') return comment;
  if (typeof comment !== 'object') return String(comment);
  const parts = [];
  function walk(node) {
    if (!node) return;
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    if (node.type === 'text' && node.text) parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(comment);
  return parts.join('').trim();
}

function textToAdf(text) {
  const t = text == null ? '' : String(text);
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: t ? [{ type: 'text', text: t }] : [],
      },
    ],
  };
}

/**
 * Format started for Jira worklog API.
 * Prefer Europe/Warsaw offset; for Sep 2026 that is +0200 (CEST).
 */
function formatStartedForJira(started) {
  const s = String(started || '').trim();
  // Already has offset like +0200 or Z
  if (/[+-]\d{4}$/.test(s) || /Z$/i.test(s)) {
    // Normalize fractional seconds
    const m = s.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(.*)$/
    );
    if (m) {
      const sec = m[4] || '00';
      const ms = (m[5] || '000').padEnd(3, '0').slice(0, 3);
      let off = m[6] || '';
      if (/Z$/i.test(off)) off = '+0000';
      return `${m[1]}T${m[2]}:${m[3]}:${sec}.${ms}${off}`;
    }
    return s;
  }
  // Local wall time without offset — attach Warsaw offset via Date
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error(`Invalid started: ${started}`);
  const y = Number(m[1].slice(0, 4));
  const mo = Number(m[1].slice(5, 7));
  const d = Number(m[1].slice(8, 10));
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  const ss = Number(m[4] || '0');
  // Compute offset for this civil time in Europe/Warsaw
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  // Find UTC instant whose Warsaw wall time matches
  let offsetMinutes = 120; // default CEST
  for (const guess of [120, 60, 0]) {
    const utcMs = Date.UTC(y, mo - 1, d, hh, mm, ss) - guess * 60 * 1000;
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value])
    );
    const wall = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    const want = `${m[1]}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    if (wall === want) {
      offsetMinutes = guess;
      break;
    }
    // Also parse from timeZoneName like GMT+2
    const tzn = parts.timeZoneName || '';
    const om = tzn.match(/GMT([+-])(\d+)(?::(\d+))?/i);
    if (om) {
      const sign = om[1] === '-' ? -1 : 1;
      offsetMinutes = sign * (Number(om[2]) * 60 + Number(om[3] || 0));
    }
  }
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offM = String(abs % 60).padStart(2, '0');
  return `${m[1]}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.000${sign}${offH}${offM}`;
}

function createClient({ baseUrl, email, apiToken }) {
  if (!baseUrl || !email || !apiToken) {
    throw new Error('Jira config incomplete: baseUrl, email, and apiToken required');
  }
  const root = String(baseUrl).replace(/\/+$/, '');
  const auth = basicAuthHeader(email, apiToken);

  async function request(method, apiPath, body) {
    const url = apiPath.startsWith('http') ? apiPath : `${root}${apiPath}`;
    const headers = {
      Authorization: auth,
      Accept: 'application/json',
    };
    const opts = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    let data = null;
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      data = text ? { raw: text } : null;
    }
    if (!res.ok) {
      const msg =
        (data && (data.errorMessages || data.errors || data.message || data.raw)) ||
        res.statusText ||
        `HTTP ${res.status}`;
      const err = new Error(
        typeof msg === 'string' ? msg : JSON.stringify(msg)
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    // 204 No Content
    if (res.status === 204) return null;
    return data;
  }

  async function getMyself() {
    return request('GET', '/rest/api/3/myself');
  }

  /**
   * List projects the user can access.
   * Tries /project/search (paginated), falls back to /project.
   * Returns [{ key, name, id }].
   */
  async function listProjects() {
    const projects = [];
    let startAt = 0;
    const maxResults = 50;
    let useSearch = true;

    while (true) {
      let page;
      if (useSearch) {
        try {
          page = await request(
            'GET',
            `/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}&orderBy=key`
          );
        } catch (e) {
          if (e.status === 404 || e.status === 410) {
            useSearch = false;
            continue;
          }
          throw e;
        }
        const batch = page.values || page.projects || [];
        for (const p of batch) {
          projects.push({
            key: p.key,
            name: p.name || p.key,
            id: p.id != null ? String(p.id) : '',
          });
        }
        const total = page.total != null ? page.total : null;
        startAt += batch.length;
        if (batch.length === 0) break;
        if (total != null && startAt >= total) break;
        if (page.isLast === true) break;
        if (batch.length < maxResults) break;
      } else {
        // Classic: returns full array
        const all = await request('GET', '/rest/api/3/project');
        const list = Array.isArray(all) ? all : [];
        for (const p of list) {
          projects.push({
            key: p.key,
            name: p.name || p.key,
            id: p.id != null ? String(p.id) : '',
          });
        }
        break;
      }
    }

    // Dedupe by key, sort
    const seen = new Set();
    return projects
      .filter((p) => {
        if (!p.key || seen.has(p.key)) return false;
        seen.add(p.key);
        return true;
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * Search issues that have worklogs by current user in the given month.
   * Paginates; returns issues with key, summary, project.
   */
  async function searchIssuesWithWorklogs(month) {
    const { start, end } = monthDateRange(month);
    const jql =
      `worklogAuthor = currentUser() AND worklogDate >= "${start}" AND worklogDate <= "${end}"`;
    const issues = [];
    let nextPageToken = null;
    let startAt = 0;
    const maxResults = 50;
    // Prefer new /search/jql; fall back to classic /search
    let useNew = true;

    while (true) {
      let page;
      if (useNew) {
        try {
          const body = {
            jql,
            maxResults,
            fields: ['summary', 'project'],
          };
          if (nextPageToken) body.nextPageToken = nextPageToken;
          page = await request('POST', '/rest/api/3/search/jql', body);
        } catch (e) {
          if (e.status === 404 || e.status === 410) {
            useNew = false;
            startAt = 0;
            continue;
          }
          throw e;
        }
        const batch = page.issues || [];
        for (const issue of batch) {
          issues.push({
            key: issue.key,
            summary: (issue.fields && issue.fields.summary) || '',
            project_key:
              (issue.fields &&
                issue.fields.project &&
                issue.fields.project.key) ||
              '',
          });
        }
        if (page.nextPageToken) {
          nextPageToken = page.nextPageToken;
          continue;
        }
        // Some responses use isLast
        if (page.isLast === false && batch.length >= maxResults) {
          break;
        }
        break;
      } else {
        page = await request('POST', '/rest/api/3/search', {
          jql,
          startAt,
          maxResults,
          fields: ['summary', 'project'],
        });
        const batch = page.issues || [];
        for (const issue of batch) {
          issues.push({
            key: issue.key,
            summary: (issue.fields && issue.fields.summary) || '',
            project_key:
              (issue.fields &&
                issue.fields.project &&
                issue.fields.project.key) ||
              '',
          });
        }
        startAt += batch.length;
        if (startAt >= (page.total || 0) || batch.length === 0) break;
      }
    }

    // Dedupe by key
    const seen = new Set();
    return issues.filter((i) => {
      if (seen.has(i.key)) return false;
      seen.add(i.key);
      return true;
    });
  }

  /** List all worklogs for an issue (paginated). */
  async function listWorklogs(issueKey) {
    const all = [];
    let startAt = 0;
    const maxResults = 100;
    while (true) {
      const page = await request(
        'GET',
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog?startAt=${startAt}&maxResults=${maxResults}`
      );
      const batch = page.worklogs || [];
      all.push(...batch);
      startAt += batch.length;
      if (startAt >= (page.total || 0) || batch.length === 0) break;
    }
    return all;
  }

  /**
   * Fetch all worklogs for current user in a month.
   * Returns array of normalized entries ready for SQLite upsert.
   */
  async function fetchMyWorklogsForMonth(month) {
    const myself = await getMyself();
    const accountId = myself.accountId;
    const authorDisplay =
      myself.displayName || myself.emailAddress || email || '';
    const issues = await searchIssuesWithWorklogs(month);
    const entries = [];

    for (const issue of issues) {
      const worklogs = await listWorklogs(issue.key);
      for (const wl of worklogs) {
        const wlAuthorId =
          (wl.author && wl.author.accountId) ||
          (wl.updateAuthor && wl.updateAuthor.accountId) ||
          '';
        if (wlAuthorId !== accountId) continue;
        if (!isInMonth(wl.started, month)) continue;
        entries.push({
          worklog_id: String(wl.id),
          issue_key: issue.key,
          issue_summary: issue.summary || '',
          project_key: issue.project_key || '',
          started: wl.started,
          time_spent_seconds: Number(wl.timeSpentSeconds) || 0,
          author: (wl.author && wl.author.displayName) || authorDisplay,
          comment: commentToText(wl.comment),
        });
      }
    }

    return { entries, myself, issueCount: issues.length };
  }

  async function addWorklog(issueKey, { timeSpentSeconds, timeSpent, started, comment }) {
    const body = {
      started: formatStartedForJira(started),
    };
    if (timeSpentSeconds != null) body.timeSpentSeconds = Number(timeSpentSeconds);
    else if (timeSpent) body.timeSpent = timeSpent;
    else throw new Error('timeSpentSeconds or timeSpent required');
    if (comment) body.comment = textToAdf(comment);
    return request(
      'POST',
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog`,
      body
    );
  }

  /**
   * Update an existing worklog.
   * PUT /rest/api/3/issue/{issueIdOrKey}/worklog/{id}
   */
  async function updateWorklog(
    issueKey,
    worklogId,
    { timeSpentSeconds, timeSpent, started, comment }
  ) {
    const body = {};
    if (started) body.started = formatStartedForJira(started);
    if (timeSpentSeconds != null) body.timeSpentSeconds = Number(timeSpentSeconds);
    else if (timeSpent) body.timeSpent = timeSpent;
    if (comment !== undefined) {
      body.comment = comment ? textToAdf(comment) : textToAdf('');
    }
    return request(
      'PUT',
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog/${encodeURIComponent(worklogId)}`,
      body
    );
  }

  /**
   * Delete a worklog.
   * DELETE /rest/api/3/issue/{issueIdOrKey}/worklog/{id}
   */
  async function deleteWorklog(issueKey, worklogId) {
    return request(
      'DELETE',
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog/${encodeURIComponent(worklogId)}`
    );
  }


  /**
   * List issues for a project (JQL: project = KEY ORDER BY updated DESC).
   * Paginates up to `cap` (default 400). Returns [{ key, summary, status }].
   */
  async function searchIssuesByProject(projectKey, { cap = 400 } = {}) {
    const key = String(projectKey || '').trim();
    if (!key) throw new Error('projectKey required');
    // Escape quotes in key (project keys are usually alphanumeric)
    const safe = key.replace(/"/g, '');
    const jql = `project = "${safe}" ORDER BY updated DESC`;
    const issues = [];
    let nextPageToken = null;
    let startAt = 0;
    const maxResults = 100;
    let useNew = true;
    const limit = Math.min(Math.max(Number(cap) || 400, 1), 500);

    while (issues.length < limit) {
      let page;
      const fields = ['summary', 'status', 'project'];
      if (useNew) {
        try {
          const body = { jql, maxResults, fields };
          if (nextPageToken) body.nextPageToken = nextPageToken;
          page = await request('POST', '/rest/api/3/search/jql', body);
        } catch (e) {
          if (e.status === 404 || e.status === 410) {
            useNew = false;
            startAt = 0;
            continue;
          }
          throw e;
        }
        const batch = page.issues || [];
        for (const issue of batch) {
          issues.push({
            key: issue.key,
            summary: (issue.fields && issue.fields.summary) || '',
            status:
              (issue.fields &&
                issue.fields.status &&
                issue.fields.status.name) ||
              '',
          });
          if (issues.length >= limit) break;
        }
        if (issues.length >= limit) break;
        if (page.nextPageToken) {
          nextPageToken = page.nextPageToken;
          continue;
        }
        break;
      } else {
        page = await request('POST', '/rest/api/3/search', {
          jql,
          startAt,
          maxResults,
          fields,
        });
        const batch = page.issues || [];
        for (const issue of batch) {
          issues.push({
            key: issue.key,
            summary: (issue.fields && issue.fields.summary) || '',
            status:
              (issue.fields &&
                issue.fields.status &&
                issue.fields.status.name) ||
              '',
          });
          if (issues.length >= limit) break;
        }
        startAt += batch.length;
        if (batch.length === 0) break;
        if (startAt >= (page.total || 0)) break;
        if (issues.length >= limit) break;
      }
    }

    const seen = new Set();
    return issues.filter((i) => {
      if (!i.key || seen.has(i.key)) return false;
      seen.add(i.key);
      return true;
    });
  }

  /**
   * User search: GET /rest/api/3/user/search?query=
   * Returns [{ accountId, displayName, emailAddress, active }].
   */
  async function searchUsers(query = '.', { maxResults = 50 } = {}) {
    const q = encodeURIComponent(query == null || query === '' ? '.' : String(query));
    const max = Math.min(Math.max(Number(maxResults) || 50, 1), 100);
    const page = await request(
      'GET',
      `/rest/api/3/user/search?query=${q}&maxResults=${max}`
    );
    const list = Array.isArray(page) ? page : [];
    return list.map((u) => ({
      accountId: u.accountId || '',
      displayName: u.displayName || '',
      emailAddress: u.emailAddress || '',
      active: u.active !== false,
    }));
  }

  /**
   * Assignable users for a project.
   * GET /rest/api/3/user/assignable/search?project=KEY&query=
   */
  async function searchAssignableUsers(projectKey, query = '', { maxResults = 50 } = {}) {
    const key = String(projectKey || '').trim();
    if (!key) throw new Error('projectKey required');
    const params = new URLSearchParams({
      project: key,
      maxResults: String(Math.min(Math.max(Number(maxResults) || 50, 1), 100)),
    });
    if (query != null && String(query).trim() !== '') {
      params.set('query', String(query).trim());
    }
    const page = await request(
      'GET',
      `/rest/api/3/user/assignable/search?${params.toString()}`
    );
    const list = Array.isArray(page) ? page : [];
    return list.map((u) => ({
      accountId: u.accountId || '',
      displayName: u.displayName || '',
      emailAddress: u.emailAddress || '',
      active: u.active !== false,
    }));
  }

  return {
    getMyself,
    listProjects,
    searchIssuesWithWorklogs,
    searchIssuesByProject,
    searchUsers,
    searchAssignableUsers,
    listWorklogs,
    fetchMyWorklogsForMonth,
    addWorklog,
    updateWorklog,
    deleteWorklog,
    formatStartedForJira,
  };
}

module.exports = {
  createClient,
  formatStartedForJira,
  commentToText,
  textToAdf,
  monthDateRange,
  lastDayOfMonth,
};
