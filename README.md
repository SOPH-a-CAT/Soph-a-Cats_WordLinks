# Word Links daily

A static HTML, CSS, and JavaScript game. Serve `dist/` using any static server. No framework, accounts, database, network data calls, or build step.

## Run locally

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser. No dependency installation is required. To deploy elsewhere, publish the contents of `dist/` with any static website host.

Run checks with Node.js:

```sh
node tests/game.cjs
```

## Daily identity

Daily v1 hashes `word-links-daily-v1:YYYY-MM-DD` using FNV-1a, then supplies a deterministic 32-bit seeded random stream to the verified puzzle generator. Dates and weekday calculations use UTC. The daily board does not depend on device, storage, or playing history. Preserve the daily-v1 vocabulary, order, seed method, and generator when changing unrelated features; changing them would change historical boards.

Sunday through Saturday use difficulty values 1, 3, 4, 6, 7, 9, 10. Their verified solution paths use 2 through 8 added words respectively. Clever shorter solutions remain possible. Daily date seeds vary every week. Tests cover 730 distinct layouts; hashes cannot mathematically guarantee unique boards for an unlimited date range.

## Archive and progress

Archive begins 2026-01-01. Dates after the current UTC date are locked. New daily puzzles unlock at 00:00 UTC; an open prior board remains saved until the player chooses Today. The calendar shows unplayed dates, in-progress dates, and completed scores. Completed boards may be revisited but cannot be replayed to farm rewards.

Browser localStorage retains each date's committed words, draft letters, direction, cursor, hints shown, credited words, incorrect attempts, completion, and score. Global hint bank, answer streak, daily visit streak, wrong count, and typing preference remain local to that browser/device. Existing practice-game progress is retained under legacy state; existing hints and rewards are preserved. Local progress does not sync across devices and clearing browser data removes it. The puzzle itself is identical across devices for a given date.

Each added word costs its length, with shared letters counted in each word. Draft boxes show one point each until submission. The final word can cross both disconnected starting chains. Validation, answer streaks, hints, manual submission, confetti, and automatic typing toggle remain available.

Play on archive dates counts toward the actual UTC day of play; it does not backfill historical visit streaks. Every three new correct submissions in a row earns one hint. Incorrect answers reset that answer streak. Every fifth consecutive day of play gives growing hints. Undo/re-submission cannot re-credit the same word placement.

Run `node tests/game.cjs` for deterministic generation, solution validity, UTC/date boundaries, archive state, progression, reward, and scoring tests.

Dictionary source notes: `DICTIONARY-NOTES.txt`.
