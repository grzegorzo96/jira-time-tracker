'use strict';

const $ = (sel) => document.querySelector(sel);

const LANG_KEY = 'jtt-lang';
const I18N = {
  en: {
    docTitle: 'Jira Time Tracker — Worklogs from Jira',
    subtitle: 'Worklogs from Jira',
    month: 'Month',
    jiraChipTitle: 'Jira connection status',
    btnConnectJira: 'Connect to Jira',
    btnConnectJiraTitle: 'Jira settings',
    btnExport: 'Export CSV',
    btnExportTitle: 'Export CSV for the selected month',
    statTotal: 'Total hours this month',
    statCount: 'Entries this month',
    statProjects: 'Hours by project',
    gridTitle: 'Monthly grid',
    gridHint: 'Rows = issues · columns = days · click a cell · auto-sync with Jira',
    gridHintFilter: ' · filter: <strong>{key}</strong> (click again to clear)',
    gridHintToday: 'Today: {date}',
    btnAdd: '+ New entry',
    gridEmptyInitial: 'No data — connect to Jira or add an entry.',
    gridEmptyMonth: 'No data for this month.',
    gridEmptyFiltered: 'No issues for project {key} this month.',
    gridEmptyEntries: 'No entries this month — connect to Jira or add one manually.',
    entriesTitle: 'Entry list',
    entriesHint: 'Details and editing for individual worklogs',
    entriesExpand: 'Expand to see entries',
    thStart: 'Start',
    thProject: 'Project',
    thIssue: 'Issue',
    thTime: 'Time',
    thComment: 'Comment',
    thActions: 'Actions',
    entriesEmpty: 'No entries — connect to Jira or add one manually.',
    dialogNew: 'New entry',
    dialogEdit: 'Edit entry',
    dialogAddHours: 'Add hours · {label} · day {day}',
    labelProject: 'Project',
    labelIssue: 'Issue',
    labelSummary: 'Summary',
    labelStart: 'Start',
    labelDuration: 'Time (hours or hh:mm)',
    labelComment: 'Comment',
    labelAuthor: 'Author',
    searchPlaceholder: 'Search…',
    searchProjectAria: 'Search project',
    searchIssueAria: 'Search issue',
    optSelectProject: '— select a project —',
    optSelectIssue: '— select an issue —',
    optNoJiraCustom: '— no Jira: enter a custom key —',
    optSelectProjectForIssues: '— select a project to load issues —',
    optCustomIssue: '— other / custom —',
    optLoadingIssues: 'Loading issues…',
    optApiTokenAccount: '— API token account —',
    projectFallbackPlaceholder: 'Project (e.g. ETP)',
    customIssuePlaceholder: 'Custom key (e.g. ETP-123)',
    summaryPlaceholder: 'Issue description',
    durationPlaceholder: '1.5 or 1:30',
    authorNote: 'The worklog in Jira will be saved under your API account',
    authorApiAccount: 'API account',
    btnCancel: 'Cancel',
    btnSave: 'Save',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    jiraDialogTitle: 'Jira settings',
    jiraTokenHint: 'API token:',
    jiraTokenPlaceholder: 'Leave blank to keep unchanged',
    jiraTokenKeep: '•••••••• (leave blank = no change)',
    jiraTokenPaste: 'Paste API token',
    jiraConnected: 'Jira: connected',
    jiraNoToken: 'Jira: no token',
    colTask: 'Issue',
    colTotal: 'Total',
    footDailyTotal: 'Daily total / grand total',
    todayTag: 'today',
    dayTitle: 'Day {day}',
    dayTodayTitle: 'Today — day {day}',
    cellAddTitle: 'Click to add hours · {label} · day {day}',
    taskFallback: 'issue',
    filterActiveTitle: 'Filter: {key} — click to show all',
    filterShowTitle: 'Show only issues for project {key}',
    confirmDelete: 'Delete this entry?',
    toastSavedJira: 'Saved and updated in Jira',
    toastSaved: 'Changes saved',
    toastAddedJiraMismatch: 'Added → Jira (as {jira}; locally: {local})',
    toastAddedJira: 'Entry added and sent to Jira',
    toastAdded: 'Entry added',
    toastDeleted: 'Deleted',
    toastJiraSaved: 'Jira settings saved',
    toastJiraSavedNoToken: 'Saved (no token)',
    toastSwitchedMonth: 'Switched to {month}',
    toastIssuesError: 'Issues: {msg}',
    toastAutoSyncError: 'Auto-sync: {msg}',
  },
  pl: {
    docTitle: 'Jira Time Tracker — Worklogi z Jiry',
    subtitle: 'Worklogi z Jiry',
    month: 'Miesiąc',
    jiraChipTitle: 'Status połączenia z Jirą',
    btnConnectJira: 'Połącz z Jirą',
    btnConnectJiraTitle: 'Ustawienia Jira',
    btnExport: 'Eksport CSV',
    btnExportTitle: 'Eksport CSV wybranego miesiąca',
    statTotal: 'Suma godzin w miesiącu',
    statCount: 'Liczba wpisów w miesiącu',
    statProjects: 'Godziny wg projektu',
    gridTitle: 'Siatka miesięczna',
    gridHint: 'Wiersze = zadania · kolumny = dni · kliknij komórkę · auto-sync z Jirą',
    gridHintFilter: ' · filtr: <strong>{key}</strong> (kliknij ponownie, by wyczyścić)',
    gridHintToday: 'Dziś: {date}',
    btnAdd: '+ Nowy wpis',
    gridEmptyInitial: 'Brak danych — połącz z Jirą lub dodaj wpis.',
    gridEmptyMonth: 'Brak danych miesiąca.',
    gridEmptyFiltered: 'Brak zadań projektu {key} w tym miesiącu.',
    gridEmptyEntries: 'Brak wpisów w tym miesiącu — połącz z Jirą lub dodaj ręcznie.',
    entriesTitle: 'Lista wpisów',
    entriesHint: 'Szczegóły i edycja pojedynczych worklogów',
    entriesExpand: 'Rozwiń, aby zobaczyć wpisy',
    thStart: 'Start',
    thProject: 'Projekt',
    thIssue: 'Zgłoszenie',
    thTime: 'Czas',
    thComment: 'Komentarz',
    thActions: 'Akcje',
    entriesEmpty: 'Brak wpisów — połącz z Jirą lub dodaj ręcznie.',
    dialogNew: 'Nowy wpis',
    dialogEdit: 'Edytuj wpis',
    dialogAddHours: 'Dodaj godziny · {label} · dzień {day}',
    labelProject: 'Projekt',
    labelIssue: 'Zgłoszenie',
    labelSummary: 'Podsumowanie',
    labelStart: 'Start',
    labelDuration: 'Czas (godziny lub hh:mm)',
    labelComment: 'Komentarz',
    labelAuthor: 'Autor',
    searchPlaceholder: 'Szukaj…',
    searchProjectAria: 'Szukaj projektu',
    searchIssueAria: 'Szukaj zgłoszenia',
    optSelectProject: '— wybierz projekt —',
    optSelectIssue: '— wybierz zgłoszenie —',
    optNoJiraCustom: '— brak Jiry: wpisz własny klucz —',
    optSelectProjectForIssues: '— wybierz projekt, by załadować zadania —',
    optCustomIssue: '— inne / własne —',
    optLoadingIssues: 'Ładowanie zadań…',
    optApiTokenAccount: '— konto z tokena API —',
    projectFallbackPlaceholder: 'Projekt (np. ETP)',
    customIssuePlaceholder: 'Własny klucz (np. ETP-123)',
    summaryPlaceholder: 'Opis zadania',
    durationPlaceholder: '1.5 lub 1:30',
    authorNote: 'Worklog w Jirze zapisze się na Twoim koncie API',
    authorApiAccount: 'Konto API',
    btnCancel: 'Anuluj',
    btnSave: 'Zapisz',
    btnEdit: 'Edytuj',
    btnDelete: 'Usuń',
    jiraDialogTitle: 'Ustawienia Jira',
    jiraTokenHint: 'Token API:',
    jiraTokenPlaceholder: 'Pozostaw puste, by nie zmieniać',
    jiraTokenKeep: '•••••••• (pozostaw puste = bez zmian)',
    jiraTokenPaste: 'Wklej token API',
    jiraConnected: 'Jira: połączona',
    jiraNoToken: 'Jira: brak tokena',
    colTask: 'Zadanie',
    colTotal: 'Suma',
    footDailyTotal: 'Suma dzienna / łącznie',
    todayTag: 'dziś',
    dayTitle: 'Dzień {day}',
    dayTodayTitle: 'Dziś — dzień {day}',
    cellAddTitle: 'Kliknij, aby dodać godziny · {label} · dzień {day}',
    taskFallback: 'zadanie',
    filterActiveTitle: 'Filtr: {key} — kliknij, by pokazać wszystkie',
    filterShowTitle: 'Pokaż tylko zadania projektu {key}',
    confirmDelete: 'Usunąć ten wpis?',
    toastSavedJira: 'Zapisano i zaktualizowano w Jirze',
    toastSaved: 'Zapisano zmiany',
    toastAddedJiraMismatch: 'Dodano → Jira (na koncie {jira}; lokalnie: {local})',
    toastAddedJira: 'Dodano wpis i wysłano do Jiry',
    toastAdded: 'Dodano wpis',
    toastDeleted: 'Usunięto',
    toastJiraSaved: 'Zapisano ustawienia Jira',
    toastJiraSavedNoToken: 'Zapisano (brak tokena)',
    toastSwitchedMonth: 'Przełączono na {month}',
    toastIssuesError: 'Zadania: {msg}',
    toastAutoSyncError: 'Auto-sync: {msg}',
  },
};

let currentLang = 'en';

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'pl') return saved;
  } catch (_) {}
  return 'en';
}

function t(key, vars) {
  const dict = I18N[currentLang] || I18N.en;
  let s = dict[key] ?? I18N.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll('{' + k + '}', String(v));
    }
  }
  return s;
}

function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    btn.setAttribute('aria-pressed', lang === currentLang ? 'true' : 'false');
  });
}

function setLang(lang) {
  if (lang !== 'en' && lang !== 'pl') return;
  currentLang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (_) {}
  applyStaticI18n();
  // Refresh chip label without side effects from updateJiraChip
  const chip = $('#jiraChip');
  if (chip) {
    if (jiraConfigured) {
      const name = (jiraMyself && jiraMyself.displayName) || '';
      chip.textContent = name ? `Jira: ${name}` : t('jiraConnected');
      chip.className = 'jira-chip ok';
    } else {
      chip.textContent = t('jiraNoToken');
      chip.className = 'jira-chip warn';
    }
  }
  const entryDlg = $('#entryDialog');
  if (entryDlg && entryDlg.open) {
    const titleEl = $('#dialogTitle');
    const mode = titleEl && titleEl.dataset.mode;
    if (mode === 'edit') titleEl.textContent = t('dialogEdit');
    else if (mode === 'addHours') {
      titleEl.textContent = t('dialogAddHours', {
        label: titleEl.dataset.label || t('taskFallback'),
        day: titleEl.dataset.day || '',
      });
    } else {
      titleEl.textContent = t('dialogNew');
    }
  }
  if (lastDashboard) {
    renderProjectChips(lastDashboard);
    renderDayGrid(lastDashboard);
    const entries = projectFilter
      ? (lastDashboard.entries || []).filter((e) => (e.project_key || '') === projectFilter)
      : lastDashboard.entries;
    renderEntries(entries || []);
  }
  const projSel = $('#fProject');
  if (projSel && projSel.options.length && !projSel.options[0].value) {
    projSel.options[0].textContent = t('optSelectProject');
  }
  const issSel = $('#fIssue');
  if (issSel && issSel.options.length) {
    const first = issSel.options[0];
    if (first && !first.value) {
      first.textContent = jiraConfigured ? t('optSelectIssue') : t('optNoJiraCustom');
    }
    const custom = [...issSel.options].find((o) => o.value === CUSTOM_ISSUE_VALUE);
    if (custom) custom.textContent = t('optCustomIssue');
  }
}

currentLang = loadLang();

const monthInput = $('#monthInput');
const entriesBody = $('#entriesBody');
const entriesSection = $('#entriesSection');
const toastEl = $('#toast');
const dialog = $('#entryDialog');
const entryForm = $('#entryForm');

let toastTimer = null;

/** @type {string|null} project key filter for day grid / entries; null = all */
let projectFilter = null;
/** @type {object|null} last dashboard payload for re-render without refetch */
let lastDashboard = null;
function toast(msg, type = 'ok') {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  toastEl.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 3500);
}

let jiraConfigured = false;
/** @type {{ displayName: string, accountId: string, email: string } | null} */
let jiraMyself = null;
const DEFAULT_AUTHOR = ''; // filled from Jira /myself (token account)
const CUSTOM_ISSUE_VALUE = '__custom__';

/** Filter <select> options by query (key + label). Returns first matching option with a value. */
function filterSelectOptions(sel, query) {
  if (!sel) return null;
  const q = (query || '').trim().toLowerCase();
  let firstMatch = null;
  for (const opt of sel.options) {
    if (!q) {
      opt.hidden = false;
      continue;
    }
    const hay = `${opt.value} ${opt.textContent || ''}`.toLowerCase();
    const match = hay.includes(q);
    opt.hidden = !match;
    if (match && opt.value && !firstMatch) firstMatch = opt;
  }
  return firstMatch;
}

function clearSelectFilter(filterEl, selectEl) {
  if (filterEl) filterEl.value = '';
  if (selectEl) filterSelectOptions(selectEl, '');
}

function clearEntrySelectFilters() {
  clearSelectFilter($('#fProjectFilter'), $('#fProject'));
  clearSelectFilter($('#fIssueFilter'), $('#fIssue'));
}

function syncProjectFilterVisibility() {
  const fil = $('#fProjectFilter');
  const sel = $('#fProject');
  const wrap = fil && fil.closest('.select-with-filter');
  if (!fil || !sel) return;
  const hide = !!sel.hidden;
  fil.hidden = hide;
  if (wrap) wrap.classList.toggle('fallback-mode', hide);
}

function bindSelectFilter(filterEl, selectEl) {
  if (!filterEl || !selectEl) return;
  filterEl.addEventListener('input', () => {
    filterSelectOptions(selectEl, filterEl.value);
  });
  filterEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const first = filterSelectOptions(selectEl, filterEl.value);
    if (!first) return;
    selectEl.value = first.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  });
}


function updateJiraChip(status) {
  const chip = $('#jiraChip');
  if (!chip) return;
  const was = jiraConfigured;
  jiraConfigured = !!(status && status.configured);
  if (status && status.myself) {
    jiraMyself = status.myself;
  }
  if (jiraConfigured) {
    const name = (jiraMyself && jiraMyself.displayName) || '';
    chip.textContent = name ? `Jira: ${name}` : t('jiraConnected');
    chip.className = 'jira-chip ok';
  } else if (status && status.hasToken === false) {
    chip.textContent = t('jiraNoToken');
    chip.className = 'jira-chip warn';
  } else {
    chip.textContent = t('jiraNoToken');
    chip.className = 'jira-chip warn';
  }
  if (jiraConfigured && !was) {
    loadJiraProjects().catch(() => {});
  } else if (!jiraConfigured) {
    populateProjectSelect([]);
  }
}

async function refreshJiraStatus() {
  try {
    const status = await api('/api/jira/status');
    updateJiraChip(status);
    return status;
  } catch {
    updateJiraChip({ configured: false, hasToken: false });
    return null;
  }
}

let jiraProjects = []; // [{ key, name, id }]
let lastIssueKeys = []; // from current month grid for datalist
let lastAutoPullAt = 0;
const AUTO_PULL_THROTTLE_MS = 60 * 1000;

function getProjectValue() {
  const sel = $('#fProject');
  const txt = $('#fProjectText');
  if (jiraConfigured && sel && !sel.hidden) {
    return (sel.value || '').trim();
  }
  if (txt && !txt.hidden) return (txt.value || '').trim();
  if (sel) return (sel.value || '').trim();
  if (txt) return (txt.value || '').trim();
  return '';
}

function setProjectValue(key) {
  const sel = $('#fProject');
  const txt = $('#fProjectText');
  const k = key || '';
  if (jiraConfigured && sel) {
    // Ensure option exists
    if (k && ![...sel.options].some((o) => o.value === k)) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      sel.appendChild(opt);
    }
    sel.value = k;
    sel.hidden = false;
    sel.required = true;
    if (txt) {
      txt.hidden = true;
      txt.required = false;
      txt.value = k;
    }
  } else {
    if (sel) {
      sel.hidden = true;
      sel.required = false;
    }
    if (txt) {
      txt.hidden = false;
      txt.required = true;
      txt.value = k;
    }
  }
  syncProjectFilterVisibility();
}

function populateProjectSelect(projects) {
  const sel = $('#fProject');
  const txt = $('#fProjectText');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">${t('optSelectProject')}</option>`;
  for (const p of projects || []) {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.name && p.name !== p.key ? `${p.key} — ${p.name}` : p.key;
    sel.appendChild(opt);
  }
  if (current) sel.value = current;
  if (jiraConfigured && projects && projects.length) {
    sel.hidden = false;
    sel.required = true;
    if (txt) {
      txt.hidden = true;
      txt.required = false;
    }
  } else {
    sel.hidden = true;
    sel.required = false;
    if (txt) {
      txt.hidden = false;
      txt.required = true;
    }
  }
  clearSelectFilter($('#fProjectFilter'), sel);
  syncProjectFilterVisibility();
}

async function loadJiraProjects() {
  if (!jiraConfigured) {
    jiraProjects = [];
    populateProjectSelect([]);
    return [];
  }
  try {
    const data = await api('/api/jira/projects');
    jiraProjects = data.projects || [];
    populateProjectSelect(jiraProjects);
    return jiraProjects;
  } catch (err) {
    jiraProjects = [];
    populateProjectSelect([]);
    return [];
  }
}

function updateIssueDatalist(keys) {
  // Kept for month-grid keys fallback when Jira offline
  lastIssueKeys = keys || lastIssueKeys;
}

let projectIssues = []; // [{ key, summary, status }]
let projectUsers = []; // [{ accountId, displayName, emailAddress }]
let issuesLoadToken = 0;
let usersLoadToken = 0;

function getIssueValue() {
  const sel = $('#fIssue');
  const custom = $('#fIssueCustom');
  if (!sel) return '';
  if (sel.value === CUSTOM_ISSUE_VALUE) {
    return custom ? custom.value.trim() : '';
  }
  return (sel.value || '').trim();
}

function setIssueCustomVisible(show) {
  const custom = $('#fIssueCustom');
  if (!custom) return;
  custom.hidden = !show;
  if (show) custom.focus();
}

function populateIssueSelect(issues, { selectedKey = '', allowEmpty = true } = {}) {
  const sel = $('#fIssue');
  if (!sel) return;
  projectIssues = issues || [];
  const opts = [];
  if (allowEmpty) {
    opts.push(
      `<option value="">${
        jiraConfigured
          ? t('optSelectIssue')
          : t('optNoJiraCustom')
      }</option>`
    );
  }
  for (const iss of projectIssues) {
    const label = iss.summary
      ? `${iss.key} — ${iss.summary}`
      : iss.key;
    const selAttr = iss.key === selectedKey ? ' selected' : '';
    opts.push(
      `<option value="${escapeHtml(iss.key)}"${selAttr}>${escapeHtml(label)}</option>`
    );
  }
  // Fallback keys from local month data if list empty
  if (!projectIssues.length && lastIssueKeys.length) {
    for (const k of lastIssueKeys) {
      if (!k) continue;
      const selAttr = k === selectedKey ? ' selected' : '';
      opts.push(`<option value="${escapeHtml(k)}"${selAttr}>${escapeHtml(k)}</option>`);
    }
  }
  const customSelected = selectedKey && ![...projectIssues.map((i) => i.key), ...lastIssueKeys].includes(selectedKey);
  opts.push(
    `<option value="${CUSTOM_ISSUE_VALUE}"${customSelected ? ' selected' : ''}>${t('optCustomIssue')}</option>`
  );
  sel.innerHTML = opts.join('');
  if (customSelected && selectedKey) {
    sel.value = CUSTOM_ISSUE_VALUE;
    const custom = $('#fIssueCustom');
    if (custom) {
      custom.hidden = false;
      custom.value = selectedKey;
    }
  } else if (selectedKey && [...sel.options].some((o) => o.value === selectedKey)) {
    sel.value = selectedKey;
    setIssueCustomVisible(false);
  } else {
    setIssueCustomVisible(sel.value === CUSTOM_ISSUE_VALUE);
  }
  const issFilter = $('#fIssueFilter');
  if (issFilter && issFilter.value.trim()) {
    filterSelectOptions(sel, issFilter.value);
  } else {
    clearSelectFilter(issFilter, sel);
  }
}

async function loadIssuesForProject(projectKey, { selectedKey = '' } = {}) {
  const token = ++issuesLoadToken;
  if (!projectKey || !jiraConfigured) {
    populateIssueSelect([], { selectedKey });
    if (!jiraConfigured) {
      // Force custom entry mode
      const sel = $('#fIssue');
      if (sel) {
        sel.value = CUSTOM_ISSUE_VALUE;
        setIssueCustomVisible(true);
        if (selectedKey && $('#fIssueCustom')) $('#fIssueCustom').value = selectedKey;
      }
    }
    return [];
  }
  populateIssueSelect([], { selectedKey: '' });
  const sel = $('#fIssue');
  if (sel) {
    sel.innerHTML = `<option value="">${t('optLoadingIssues')}</option>`;
  }
  try {
    const data = await api(
      `/api/jira/issues?project=${encodeURIComponent(projectKey)}`
    );
    if (token !== issuesLoadToken) return data.issues || [];
    populateIssueSelect(data.issues || [], { selectedKey });
    // Auto-fill summary if selected
    if (selectedKey) {
      const found = (data.issues || []).find((i) => i.key === selectedKey);
      if (found && found.summary && !$('#fSummary').value) {
        $('#fSummary').value = found.summary;
      }
    }
    return data.issues || [];
  } catch (err) {
    if (token !== issuesLoadToken) return [];
    populateIssueSelect([], { selectedKey });
    toast(t('toastIssuesError', { msg: err.message }), 'error');
    return [];
  }
}

function getAuthorDisplayName() {
  const sel = $('#fAuthor');
  if (!sel) return DEFAULT_AUTHOR;
  const opt = sel.selectedOptions && sel.selectedOptions[0];
  if (opt && opt.dataset && opt.dataset.display) return opt.dataset.display;
  return (sel.value || '').trim() || DEFAULT_AUTHOR;
}

function defaultAuthorName() {
  if (jiraMyself && jiraMyself.displayName) return jiraMyself.displayName;
  if (jiraMyself && jiraMyself.email) return jiraMyself.email;
  return DEFAULT_AUTHOR || t('authorApiAccount');
}

function updateAuthorNote() {
  const note = $('#authorNote');
  if (!note) return;
  const me = defaultAuthorName();
  const selected = getAuthorDisplayName();
  const mismatch =
    jiraConfigured &&
    selected &&
    me &&
    selected.trim().toLowerCase() !== me.trim().toLowerCase();
  note.hidden = !mismatch;
}

function populateAuthorSelect(users, { selectedName = '' } = {}) {
  const sel = $('#fAuthor');
  if (!sel) return;
  projectUsers = users || [];
  const meName = defaultAuthorName();
  const meId = (jiraMyself && jiraMyself.accountId) || '';
  const want = selectedName || meName;

  const seen = new Set();
  const opts = [];

  function addUser(u, selected) {
    const name = u.displayName || u.emailAddress || '';
    if (!name || seen.has(name)) return;
    seen.add(name);
    const val = u.accountId || name;
    const label = u.emailAddress && u.emailAddress !== name
      ? `${name} (${u.emailAddress})`
      : name;
    opts.push(
      `<option value="${escapeHtml(val)}" data-display="${escapeHtml(name)}"${
        selected ? ' selected' : ''
      }>${escapeHtml(label)}</option>`
    );
  }

  // Myself first
  addUser(
    {
      accountId: meId,
      displayName: meName,
      emailAddress: (jiraMyself && jiraMyself.email) || '',
    },
    want.trim().toLowerCase() === meName.trim().toLowerCase()
  );

  for (const u of projectUsers) {
    const isSel =
      (u.displayName || '').trim().toLowerCase() === want.trim().toLowerCase();
    addUser(u, isSel && want.trim().toLowerCase() !== meName.trim().toLowerCase());
  }

  // If selected author not in list, add it
  if (want && !seen.has(want)) {
    addUser({ displayName: want, accountId: '', emailAddress: '' }, true);
  }

  sel.innerHTML = opts.join('') || `<option value="${escapeHtml(meName)}" data-display="${escapeHtml(meName)}" selected>${escapeHtml(meName)}</option>`;
  updateAuthorNote();
}

async function loadUsersForProject(projectKey, { selectedName = '' } = {}) {
  const token = ++usersLoadToken;
  const fallbackName = selectedName || defaultAuthorName();
  if (!jiraConfigured) {
    populateAuthorSelect([], { selectedName: fallbackName });
    return [];
  }
  try {
    const meQuery =
      (jiraMyself && (jiraMyself.displayName || jiraMyself.email)) || 'a';
    const q = projectKey
      ? `/api/jira/users?project=${encodeURIComponent(projectKey)}`
      : `/api/jira/users?query=${encodeURIComponent(meQuery)}`;
    const data = await api(q);
    if (token !== usersLoadToken) return data.users || [];
    populateAuthorSelect(data.users || [], { selectedName: fallbackName });
    return data.users || [];
  } catch (err) {
    if (token !== usersLoadToken) return [];
    populateAuthorSelect([], { selectedName: fallbackName });
    return [];
  }
}

async function onProjectChanged() {
  const project = getProjectValue();
  const keepIssue = getIssueValue();
  const keepAuthor = getAuthorDisplayName();
  clearSelectFilter($('#fIssueFilter'), $('#fIssue'));
  await Promise.all([
    loadIssuesForProject(project, { selectedKey: keepIssue }),
    loadUsersForProject(project, { selectedName: keepAuthor || defaultAuthorName() }),
  ]);
}

/** Silent auto-pull; toast only on change or error. Returns pull result or null. */
async function autoPullFromJira({ force = false } = {}) {
  if (!jiraConfigured) return null;
  const now = Date.now();
  if (!force && now - lastAutoPullAt < AUTO_PULL_THROTTLE_MS) return null;
  lastAutoPullAt = now;
  const month = monthInput.value || currentMonth();
  try {
    const data = await api('/api/jira/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    });
    const changed =
      (data.imported || 0) + (data.updated || 0) + (data.removed || 0) > 0;
    if (changed) {
      toast(
        `Sync: +${data.imported} / ⌁${data.updated} / −${data.removed} · ${data.totalHours} h`,
        'ok'
      );
      await loadDashboard({ skipPull: true });
    }
    return data;
  } catch (err) {
    toast(t('toastAutoSyncError', { msg: err.message }), 'error');
    return null;
  }
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayParts() {
  const d = new Date();
  return {
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    day: d.getDate(),
    date: d,
  };
}

function formatTodayLong(d) {
  const locale = currentLang === 'pl' ? 'pl-PL' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function toLocalInputValue(isoOrLocal) {
  if (!isoOrLocal) return '';
  // Accept Jira-style 2026-09-01T09:07:00.000+0200 or ISO
  const s = String(isoOrLocal);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return `${m[1]}T${m[2]}:${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(v) {
  // Keep as local wall time with seconds: YYYY-MM-DDTHH:mm:00
  if (!v) return '';
  return v.length === 16 ? `${v}:00` : v;
}

function formatStarted(s) {
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return `${m[1]} ${m[2]}:${m[3]}`;
  return s;
}

async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = (data && data.error) || res.statusText || 'Request failed';
    throw new Error(err);
  }
  return data;
}

function formatCellHours(h) {
  if (!h || h === 0) return '';
  // Compact number + unit (2 → 2 h, 2.5 → 2.5 h, 2.25 → 2.25 h)
  const rounded = Math.round(h * 100) / 100;
  return `${rounded} h`;
}

function renderDayGrid(data) {
  const head = $('#dayGridHead');
  const body = $('#dayGridBody');
  const foot = $('#dayGridFoot');
  const hint = $('.section-hint');
  const days = data.days || [];
  const allRows = data.dayGrid || [];
  const rows = projectFilter
    ? allRows.filter((r) => (r.project_key || '') === projectFilter)
    : allRows;
  const viewingMonth = monthInput.value || currentMonth();
  const today = todayParts();
  const todayDay = viewingMonth === today.month ? today.day : null;

  if (hint) {
    const filterNote = projectFilter
      ? t('gridHintFilter', { key: escapeHtml(projectFilter) })
      : '';
    if (todayDay != null) {
      hint.innerHTML = `${t('gridHint')}${filterNote}<br><strong class="today-label">${t('gridHintToday', { date: formatTodayLong(today.date) })}</strong>`;
    } else {
      hint.innerHTML = `${t('gridHint')}${filterNote}`;
    }
  }

  if (!days.length) {
    head.innerHTML = '';
    body.innerHTML = `<tr><td class="empty">${t('gridEmptyMonth')}</td></tr>`;
    foot.innerHTML = '';
    return;
  }

  const dayHeaders = days
    .map((d) => {
      const isToday = todayDay != null && d === todayDay;
      const cls = isToday ? 'col-day today-col' : 'col-day';
      const label = isToday
        ? `<span class="day-num">${d}</span><span class="day-today-tag">${t('todayTag')}</span>`
        : String(d);
      const title = isToday ? t('dayTodayTitle', { day: d }) : t('dayTitle', { day: d });
      return `<th class="${cls}" data-day="${d}" title="${title}">${label}</th>`;
    })
    .join('');
  head.innerHTML = `<tr>
    <th class="col-task">${t('colTask')}</th>
    ${dayHeaders}
    <th class="col-total">${t('colTotal')}</th>
  </tr>`;

  if (!rows.length) {
    const emptyMsg = projectFilter
      ? t('gridEmptyFiltered', { key: escapeHtml(projectFilter) })
      : t('gridEmptyEntries');
    body.innerHTML = `<tr><td class="empty" colspan="${days.length + 2}">${emptyMsg}</td></tr>`;
    foot.innerHTML = '';
    return;
  }

  body.innerHTML = rows
    .map((r) => {
      const cells = (r.hoursByDay || [])
        .map((h, i) => {
          const d = days[i];
          const isToday = todayDay != null && d === todayDay;
          let cls = h > 0 ? 'cell-hours has-time editable' : 'cell-hours zero editable';
          if (isToday) cls += ' today-col';
          const title = t('cellAddTitle', { label: r.issue_key || t('taskFallback'), day: d });
          return `<td class="${cls}" data-day="${d}" title="${escapeHtml(title)}">${escapeHtml(formatCellHours(h))}</td>`;
        })
        .join('');
      const proj = r.project_key
        ? `<span class="task-proj">${escapeHtml(r.project_key)}</span>`
        : '';
      const sum = r.issue_summary
        ? `<span class="task-sum">${escapeHtml(r.issue_summary)}</span>`
        : '';
      const ik = r.issue_key === '(none)' ? '' : (r.issue_key || '');
      return `<tr
        data-issue-key="${escapeHtml(ik)}"
        data-issue-summary="${escapeHtml(r.issue_summary || '')}"
        data-project-key="${escapeHtml(r.project_key || '')}"
      >
        <td class="col-task">
          <span class="task-key">${escapeHtml(r.issue_key || '—')}</span>${proj}
          ${sum}
        </td>
        ${cells}
        <td class="col-total">${escapeHtml(formatCellHours(r.totalHours) || '0')}</td>
      </tr>`;
    })
    .join('');

  // Footer totals: for filtered view recompute from visible rows
  let dayTotals;
  let grandTotal;
  if (projectFilter) {
    dayTotals = days.map((_, i) => {
      const sec = rows.reduce((acc, r) => acc + ((r.secondsByDay && r.secondsByDay[i]) || 0), 0);
      return Math.round((sec / 3600) * 100) / 100;
    });
    const totSec = rows.reduce((acc, r) => acc + (r.totalSeconds || 0), 0);
    grandTotal = Math.round((totSec / 3600) * 100) / 100;
  } else {
    dayTotals = data.dayTotalsHours || days.map(() => 0);
    grandTotal = data.totalHours;
  }
  const totCells = dayTotals
    .map((h, i) => {
      const d = days[i];
      const isToday = todayDay != null && d === todayDay;
      let cls = h > 0 ? 'cell-hours has-time' : 'cell-hours zero';
      if (isToday) cls += ' today-col';
      return `<td class="${cls}" data-day="${d}">${escapeHtml(formatCellHours(h))}</td>`;
    })
    .join('');
  foot.innerHTML = `<tr>
    <td class="col-task">${t('footDailyTotal')}</td>
    ${totCells}
    <td class="col-total">${escapeHtml(formatCellHours(grandTotal) || '0')}</td>
  </tr>`;

  scrollDayGridToToday(todayDay);
}

function scrollDayGridToToday(todayDay) {
  if (todayDay == null) return;
  requestAnimationFrame(() => {
    const wrap = document.querySelector('.grid-wrap');
    const target = document.querySelector(`#dayGridHead th.today-col`);
    if (!wrap || !target) return;
    const wrapRect = wrap.getBoundingClientRect();
    const cellRect = target.getBoundingClientRect();
    const delta =
      cellRect.left - wrapRect.left - wrapRect.width / 2 + cellRect.width / 2;
    wrap.scrollBy({ left: delta, behavior: 'smooth' });
  });
}

async function loadDashboard(_opts = {}) {
  const month = monthInput.value || currentMonth();
  monthInput.value = month;
  const data = await api(`/api/dashboard?month=${encodeURIComponent(month)}`);

  $('#statTotal').textContent = `${data.totalHours.toFixed(2)} h`;
  $('#statCount').textContent = String(data.entryCount);

  lastDashboard = data;

  // Drop filter if that project is gone this month
  if (projectFilter && !(data.byProject || []).some((p) => p.project_key === projectFilter)) {
    projectFilter = null;
  }

  renderProjectChips(data);
  renderDayGrid(data);
  const entries = projectFilter
    ? (data.entries || []).filter((e) => (e.project_key || '') === projectFilter)
    : data.entries;
  renderEntries(entries);
  const keys = (data.dayGrid || [])
    .map((r) => r.issue_key)
    .filter((k) => k && k !== '(none)');
  updateIssueDatalist(keys);
}


function renderProjectChips(data) {
  const projects = $('#statProjects');
  if (!projects) return;
  if (!data.byProject || !data.byProject.length) {
    projects.textContent = '—';
    return;
  }
  projects.innerHTML = data.byProject
    .map((p) => {
      const key = p.project_key || '';
      const active = projectFilter === key ? ' active' : '';
      const title = projectFilter === key
        ? t('filterActiveTitle', { key })
        : t('filterShowTitle', { key });
      return `<button type="button" class="chip chip-filter${active}" data-project-key="${escapeHtml(key)}" title="${escapeHtml(title)}">${escapeHtml(key)}<strong>${p.hours.toFixed(2)} h</strong></button>`;
    })
    .join('');
}

function applyProjectFilter(key) {
  if (!key) {
    projectFilter = null;
  } else if (projectFilter === key) {
    projectFilter = null; // toggle off
  } else {
    projectFilter = key;
  }
  if (!lastDashboard) return;
  renderProjectChips(lastDashboard);
  renderDayGrid(lastDashboard);
  const entries = projectFilter
    ? (lastDashboard.entries || []).filter((e) => (e.project_key || '') === projectFilter)
    : lastDashboard.entries;
  renderEntries(entries);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ENTRIES_OPEN_KEY = 'tt_entries_open';

function restoreEntriesSectionState() {
  if (!entriesSection) return;
  try {
    entriesSection.open = localStorage.getItem(ENTRIES_OPEN_KEY) === 'true';
  } catch (_) {
    entriesSection.open = false;
  }
}

if (entriesSection) {
  entriesSection.addEventListener('toggle', () => {
    try {
      localStorage.setItem(ENTRIES_OPEN_KEY, String(entriesSection.open));
    } catch (_) {
      // Ignore unavailable localStorage (for example in private browsing).
    }
  });
  restoreEntriesSectionState();
}

function renderEntries(entries) {
  if (!entries.length) {
    entriesBody.innerHTML =
      `<tr><td colspan="6" class="empty">${t('entriesEmpty')}</td></tr>`;
    return;
  }
  entriesBody.innerHTML = entries
    .map(
      (e) => `
    <tr data-id="${e.id}">
      <td>${escapeHtml(formatStarted(e.started))}</td>
      <td>${escapeHtml(e.project_key || '—')}</td>
      <td class="issue-cell">
        <div class="key">${escapeHtml(e.issue_key || '—')}</div>
        <div class="sum">${escapeHtml(e.issue_summary || '')}</div>
      </td>
      <td>${escapeHtml(e.time_spent)} <span class="sum">(${e.hours.toFixed(2)} h)</span></td>
      <td>${escapeHtml(e.comment || '')}</td>
      <td class="actions-cell">
        <div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${e.id}">${t('btnEdit')}</button>
          <button type="button" class="btn btn-danger btn-sm" data-del="${e.id}">${t('btnDelete')}</button>
        </div>
      </td>
    </tr>`
    )
    .join('');
}

async function openCreate() {
  $('#dialogTitle').textContent = t('dialogNew');
  $('#dialogTitle').dataset.mode = 'new';
  $('#entryId').value = '';
  clearEntrySelectFilters();
  setProjectValue('');
  populateIssueSelect([], { selectedKey: '' });
  $('#fSummary').value = '';
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  $('#fStarted').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
  $('#fDuration').value = '1';
  $('#fComment').value = '';
  // Prefer the Jira account tied to the API token as default author
  if (jiraConfigured && !jiraMyself) {
    try { await refreshJiraStatus(); } catch (_) {}
  }
  populateAuthorSelect([], { selectedName: defaultAuthorName() });
  dialog.showModal();
  if (jiraConfigured) {
    loadUsersForProject('', { selectedName: defaultAuthorName() }).catch(() => {});
  }
}

async function openAddHoursFromCell({ issueKey, issueSummary, projectKey, day }) {
  const month = monthInput.value || currentMonth();
  const pad = (n) => String(n).padStart(2, '0');
  const today = todayParts();
  const now = new Date();
  let hh = pad(now.getHours());
  let mm = pad(now.getMinutes());
  if (!(month === today.month && Number(day) === today.day)) {
    hh = '09';
    mm = '00';
  }
  const label = issueKey || t('taskFallback');
  $('#dialogTitle').textContent = t('dialogAddHours', { label, day });
  $('#dialogTitle').dataset.mode = 'addHours';
  $('#dialogTitle').dataset.label = label;
  $('#dialogTitle').dataset.day = String(day);
  $('#entryId').value = '';
  clearEntrySelectFilters();
  setProjectValue(projectKey || '');
  $('#fSummary').value = issueSummary || '';
  $('#fStarted').value = `${month}-${pad(day)}T${hh}:${mm}`;
  $('#fDuration').value = '1';
  $('#fComment').value = '';
  populateAuthorSelect([], { selectedName: defaultAuthorName() });
  dialog.showModal();
  requestAnimationFrame(() => {
    const dur = $('#fDuration');
    if (dur) {
      dur.focus();
      dur.select();
    }
  });
  if (projectKey) {
    await Promise.all([
      loadIssuesForProject(projectKey, { selectedKey: issueKey || '' }),
      loadUsersForProject(projectKey, { selectedName: defaultAuthorName() }),
    ]);
  } else {
    populateIssueSelect([], { selectedKey: issueKey || '' });
  }
}

async function openEdit(id) {
  const e = await api(`/api/entries/${id}`);
  $('#dialogTitle').textContent = t('dialogEdit');
  $('#dialogTitle').dataset.mode = 'edit';
  $('#entryId').value = String(e.id);
  clearEntrySelectFilters();
  setProjectValue(e.project_key || '');
  $('#fSummary').value = e.issue_summary || '';
  $('#fStarted').value = toLocalInputValue(e.started);
  const h = e.time_spent_seconds / 3600;
  $('#fDuration').value = Number.isInteger(h) ? String(h) : h.toFixed(2);
  $('#fComment').value = e.comment || '';
  populateAuthorSelect([], { selectedName: e.author || defaultAuthorName() });
  dialog.showModal();
  if (e.project_key) {
    await Promise.all([
      loadIssuesForProject(e.project_key, { selectedKey: e.issue_key || '' }),
      loadUsersForProject(e.project_key, {
        selectedName: e.author || defaultAuthorName(),
      }),
    ]);
  } else {
    populateIssueSelect([], { selectedKey: e.issue_key || '' });
  }
}

entryForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = $('#entryId').value;
  const payload = {
    project_key: getProjectValue(),
    issue_key: getIssueValue(),
    issue_summary: $('#fSummary').value.trim(),
    started: fromLocalInputValue($('#fStarted').value),
    duration: $('#fDuration').value.trim(),
    comment: $('#fComment').value.trim(),
    author: getAuthorDisplayName(),
  };
  try {
    if (id) {
      const res = await api(`/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast(res.updatedInJira ? t('toastSavedJira') : t('toastSaved'));
    } else {
      const res = await api('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.pushedToJira && res.authorMismatch) {
        toast(
          t('toastAddedJiraMismatch', { jira: res.pushedAsAuthor || 'API', local: payload.author }),
          'ok'
        );
      } else if (res.pushedToJira) {
        toast(t('toastAddedJira'));
      } else {
        toast(t('toastAdded'));
      }
    }
    dialog.close();
    await loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
});

$('#btnCancel').addEventListener('click', () => dialog.close());
$('#btnAdd').addEventListener('click', openCreate);

$('#dayGridBody').addEventListener('click', (ev) => {
  const cell = ev.target.closest('td.cell-hours.editable');
  if (!cell) return;
  const row = cell.closest('tr');
  if (!row) return;
  const day = Number(cell.getAttribute('data-day'));
  if (!day) return;
  openAddHoursFromCell({
    issueKey: row.getAttribute('data-issue-key') || '',
    issueSummary: row.getAttribute('data-issue-summary') || '',
    projectKey: row.getAttribute('data-project-key') || '',
    day,
  });
});

entriesBody.addEventListener('click', async (ev) => {
  const editId = ev.target.getAttribute('data-edit');
  const delId = ev.target.getAttribute('data-del');
  if (editId) {
    try {
      await openEdit(editId);
    } catch (err) {
      toast(err.message, 'error');
    }
  }
  if (delId) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api(`/api/entries/${delId}`, { method: 'DELETE' });
      toast(t('toastDeleted'));
      await loadDashboard();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
});

$('#btnExport').addEventListener('click', () => {
  const month = monthInput.value || currentMonth();
  window.location.href = `/api/export?month=${encodeURIComponent(month)}`;
});


// Follow calendar month until the user picks a different (past/future) month.
let followLiveMonth = true;

monthInput.addEventListener('change', () => {
  followLiveMonth = monthInput.value === currentMonth();
  projectFilter = null;
  loadDashboard().catch((err) => toast(err.message, 'error'));
});

/** Switch to the real current month when the calendar rolls over (if still following live). */
function ensureLiveMonth() {
  if (!followLiveMonth) return false;
  const now = currentMonth();
  if ((monthInput.value || '') === now) return false;
  monthInput.value = now;
  return true;
}


const statProjectsEl = $('#statProjects');
if (statProjectsEl) {
  statProjectsEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.chip-filter');
    if (!btn) return;
    applyProjectFilter(btn.getAttribute('data-project-key') || '');
  });
}

// --- Jira sync & settings ---
const jiraDialog = $('#jiraDialog');
const jiraForm = $('#jiraForm');

$('#btnJiraSettings').addEventListener('click', async () => {
  try {
    const status = await refreshJiraStatus();
    $('#jiraBaseUrl').value = (status && status.baseUrl) || 'https://niteam.atlassian.net';
    $('#jiraEmail').value = (status && status.email) || 'grzegorz.osowski@netinteractive.pl';
    $('#jiraToken').value = '';
    $('#jiraToken').placeholder = status && status.hasToken
      ? t('jiraTokenKeep')
      : t('jiraTokenPaste');
  } catch (_) {
    $('#jiraBaseUrl').value = 'https://niteam.atlassian.net';
    $('#jiraEmail').value = 'grzegorz.osowski@netinteractive.pl';
    $('#jiraToken').value = '';
  }
  jiraDialog.showModal();
});

$('#btnJiraCancel').addEventListener('click', () => jiraDialog.close());

jiraForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const body = {
    baseUrl: $('#jiraBaseUrl').value.trim(),
    email: $('#jiraEmail').value.trim(),
  };
  const token = $('#jiraToken').value;
  if (token) body.apiToken = token;
  try {
    const status = await api('/api/jira/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    updateJiraChip(status);
    if (status.configured) {
      await loadJiraProjects();
    } else {
      populateProjectSelect([]);
    }
    jiraDialog.close();
    toast(status.configured ? t('toastJiraSaved') : t('toastJiraSavedNoToken'));
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Project / issue / author dialog wiring
bindSelectFilter($('#fProjectFilter'), $('#fProject'));
bindSelectFilter($('#fIssueFilter'), $('#fIssue'));
syncProjectFilterVisibility();

const fProject = $('#fProject');
if (fProject) {
  fProject.addEventListener('change', () => {
    clearSelectFilter($('#fIssueFilter'), $('#fIssue'));
    onProjectChanged().catch((err) => toast(err.message, 'error'));
  });
}
const fProjectText = $('#fProjectText');
if (fProjectText) {
  fProjectText.addEventListener('change', () => {
    onProjectChanged().catch((err) => toast(err.message, 'error'));
  });
}
const fIssue = $('#fIssue');
if (fIssue) {
  fIssue.addEventListener('change', () => {
    if (fIssue.value === CUSTOM_ISSUE_VALUE) {
      setIssueCustomVisible(true);
      return;
    }
    setIssueCustomVisible(false);
    const found = projectIssues.find((i) => i.key === fIssue.value);
    if (found && found.summary) {
      $('#fSummary').value = found.summary;
    }
  });
}
const fAuthor = $('#fAuthor');
if (fAuthor) {
  fAuthor.addEventListener('change', updateAuthorNote);
}

// Language switcher
document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const lang = btn.getAttribute('data-lang');
    if (lang) setLang(lang);
  });
});
applyStaticI18n();

// Init
monthInput.value = currentMonth();
(async function init() {
  try {
    await refreshJiraStatus();
    if (jiraConfigured) {
      await loadJiraProjects();
    } else {
      populateProjectSelect([]);
    }
  } catch (_) {
    populateProjectSelect([]);
  }
  try {
    await loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
  // Silent auto-pull on load (after first paint of local data)
  if (jiraConfigured) {
    autoPullFromJira({ force: true }).catch(() => {});
  }
})();

// Auto-switch to the new calendar month + auto-pull on focus/visibility
async function onBecomeVisible() {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  try {
    if (ensureLiveMonth()) {
      await loadDashboard();
      toast(t('toastSwitchedMonth', { month: monthInput.value }));
    }
  } catch (err) {
    toast(err.message, 'error');
  }
  if (!jiraConfigured) return;
  autoPullFromJira({ force: false }).catch(() => {});
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') onBecomeVisible();
});
window.addEventListener('focus', onBecomeVisible);
// Also catch midnight/month rollover while the tab stays open
setInterval(() => {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  onBecomeVisible().catch(() => {});
}, 60 * 1000);

