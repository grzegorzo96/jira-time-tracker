# Jira Time Tracker

A local app for viewing and logging **Jira worklogs** in a monthly layout. Two-way sync with Jira, a tasks × days hours grid, entry CRUD, and CSV export.

Open **http://127.0.0.1:3847** after starting the server.

## Requirements

- **Node.js ≥ 22.5** (uses built-in `node:sqlite`)
- Jira Cloud account and an [API token](https://id.atlassian.com/manage-profile/security/api-tokens)

## Install

```bash
npm install
```

## Run

```bash
npm start
```

The server listens on port **3847** (override with `PORT`). If a Jira token is already saved, the app pulls the current month’s worklogs on startup.

### Optional: macOS LaunchAgent

You can keep the server running as LaunchAgent `pl.netinteractive.time-tracker` (KeepAlive). After changing `server.js`:

```bash
launchctl kickstart -k gui/$(id -u)/pl.netinteractive.time-tracker
```

Log file: `/tmp/time-tracker.log`

## Connect to Jira

In the UI, click **Połącz z Jirą** and enter:

| Field | Example |
|-------|---------|
| Base URL | `https://your-site.atlassian.net` |
| Email | Atlassian account email |
| API token | token from id.atlassian.com |

Config is stored in `data/jira-config.json` (gitignored).

Once connected:

- **Pull** — on load and when the window gains focus (throttled to about once per 60s)
- **Push** — creates and updates go to Jira; deletes remove the remote worklog too
- The entry form loads projects, issues, and authors from Jira (default author = the token user)

Worklogs in Jira are always created as the API token account.

## Features

- Monthly tasks × days grid (hours with “h”, today highlighted, click a cell to add time)
- Project chips filter the grid and entry list (click again to clear)
- Collapsible entry list with edit and delete
- CSV export columns: `issue_key`, `issue_summary`, `project_key`, `started`, `time_spent`, `author`, `comment` (`started` as `YYYY-MM-DD HH:MM:SS`)
- Month picker follows the calendar month unless you pick another month manually

## Stack

- Node.js + Express
- SQLite via `node:sqlite` → `data/tracker.db`
- Vanilla HTML / CSS / JS in `public/`

## Data files

| What | Path |
|------|------|
| SQLite database | `data/tracker.db` |
| Jira config (token) | `data/jira-config.json` |
| UI | `public/` |

## License

Personal / internal use.
