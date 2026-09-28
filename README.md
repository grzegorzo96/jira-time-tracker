# Jira Time Tracker

Lokalna aplikacja do przeglądania i zapisywania **worklogów Jira** w układzie miesięcznym. Dwukierunkowa synchronizacja z Jirą (pull + push), siatka zadań × dni, CRUD wpisów i eksport CSV. Bez stopera — godziny logujesz do konkretnych zgłoszeń.

UI: **http://127.0.0.1:3847**

## Wymagania

- **Node.js ≥ 22.5** (wbudowany `node:sqlite`)
- Konto Jira Cloud + [API token](https://id.atlassian.com/manage-profile/security/api-tokens)

## Instalacja

```bash
cd /Users/grzegorzosowski/time-tracker   # lub katalog sklonowanego projektu
npm install
```

## Uruchomienie

```bash
npm start
```

Serwer startuje na porcie **3847** (zmienna `PORT` nadpisuje). Otwórz w przeglądarce:

**http://127.0.0.1:3847**

Przy każdym starcie aplikacja sama łączy się z Jirą (jeśli masz zapisany token) i pobiera worklogi bieżącego miesiąca.

### Autostart na macOS (opcjonalnie)

Możesz trzymać serwer jako LaunchAgent `pl.netinteractive.time-tracker` (KeepAlive). Po zmianie `server.js`:

```bash
launchctl kickstart -k gui/$(id -u)/pl.netinteractive.time-tracker
```

Log: `/tmp/time-tracker.log`

## Połączenie z Jirą

W UI kliknij **Połącz z Jirą** i podaj:

| Pole | Przykład |
|------|----------|
| Base URL | `https://niteam.atlassian.net` |
| Email | adres konta Atlassian |
| API token | token z id.atlassian.com |

Zapisuje się lokalnie w `data/jira-config.json` (katalog `data/` jest w `.gitignore` — token nie trafia do gita).

Po połączeniu:

- **Pull** — przy starcie / focusie okna (max co ~60 s) pobiera Twoje worklogi z Jiry
- **Push** — każdy zapis i edycja godzin idzie do Jiry; usunięcie kasuje też worklog w Jirze
- W formularzu wybierasz projekt, zgłoszenie i autora z list Jiry (domyślny autor = użytkownik tokena)

Worklogi w Jirze zawsze powstają na koncie właściciela tokena API.

## Co robi UI

- **Siatka miesięczna** — zadania × dni, godziny z „h”, podświetlenie dziś, klik w komórkę dodaje godziny
- **Godziny wg projektu** — klik w chip filtruje siatkę i listę wpisów (ponowny klik czyści filtr)
- **Lista wpisów** — zwijana, edycja / usuwanie
- **Eksport CSV** — kolumny: `issue_key`, `issue_summary`, `project_key`, `started`, `time_spent`, `author`, `comment` (`started` jako `YYYY-MM-DD HH:MM:SS`)
- Miesiąc w pickerze sam przełącza się na bieżący po zmianie miesiąca kalendarzowego (chyba że ręcznie wybrałeś inny)

## Stack

- Node.js + Express
- SQLite (`node:sqlite`) → `data/tracker.db`
- Frontend: zwykły HTML / CSS / JS w `public/`

## Pliki danych

| Co | Ścieżka |
|----|---------|
| Baza SQLite | `data/tracker.db` |
| Konfiguracja Jira (token) | `data/jira-config.json` |
| UI | `public/` |

## Licencja

Użycie osobiste / wewnętrzne.
