# aaPanel Cron Setup — ManagedAd

ManagedAd runs 16 scheduled jobs that drive sync, optimization, and reporting.
Vercel cron is not used; aaPanel system cron hits each route over HTTPS.

## One-time prep

1. Set `CRON_SECRET` in the app's `.env` (same value the running Node app sees).
   Generate with: `openssl rand -hex 32`
2. Replace `https://managedad.com` below with your production domain.
3. In aaPanel: **Cron → Add Task**. Type = *Shell Script*. For each row, paste
   the command into the script body and set the cron expression as shown.

## Cron table

Use these 16 entries. Each one uses `curl -fsS` so failures surface in aaPanel
task logs, and `--max-time 600` so a hung request can't pile up.

```
# every hour — sync ad platform data into our DB
0 * * * *      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/sync-ads

# every 30 min — anomaly detection on live metrics
*/30 * * * *   curl -fsS --max-time 300 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/anomaly

# every hour — budget pacing optimizer
0 * * * *      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/budget-optimize

# every 6 hours — mine new negative keywords
0 */6 * * *    curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/mine-negatives

# daily 06:00 — full optimization pass
0 6 * * *      curl -fsS --max-time 900 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/optimize

# daily 08:00 — daily digest email
0 8 * * *      curl -fsS --max-time 300 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/daily-digest

# Mondays 07:00 — weekly audit
0 7 * * 1      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/audit

# Mondays 09:00 — weekly report email
0 9 * * 1      curl -fsS --max-time 300 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-report

# Wednesdays 03:00 — refresh long-lived Meta tokens
0 3 * * 3      curl -fsS --max-time 120 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/refresh-meta-tokens

# 1st of month 07:00 — monthly report
0 7 1 * *      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/monthly-report

# Tuesdays 05:00 — weekly keyword review
0 5 * * 2      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-keyword-review

# Wednesdays 05:00 — weekly creative review
0 5 * * 3      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-creative-review

# Thursdays 05:00 — weekly bid review
0 5 * * 4      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-bid-review

# Fridays 05:00 — weekly budget review
0 5 * * 5      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-budget-review

# Saturdays 05:00 — weekly competitor review
0 5 * * 6      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-competitor-review

# Mondays 07:00 — weekly AI recommendations
0 7 * * 1      curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/weekly-recommendations
```

## Exposing CRON_SECRET to cron jobs

aaPanel cron runs as a non-login shell, so it won't read `.env.local`. Two
options — pick one:

**Option A: hardcode in each cron line.** Replace `$CRON_SECRET` with the
literal token in every command. Simple, but rotating the secret means editing
16 entries.

**Option B: export from `/etc/profile.d/managedad.sh` (recommended).**

```bash
# create the file, owned by root, readable only by root
sudo tee /etc/profile.d/managedad.sh > /dev/null <<'EOF'
export CRON_SECRET="paste-your-hex-secret-here"
EOF
sudo chmod 600 /etc/profile.d/managedad.sh
```

Then prefix each cron command with `. /etc/profile.d/managedad.sh &&` so the
variable is loaded before curl runs. Example:

```
0 * * * *  . /etc/profile.d/managedad.sh && curl -fsS --max-time 600 -H "Authorization: Bearer $CRON_SECRET" https://managedad.com/api/cron/sync-ads
```

## Verifying after setup

1. In aaPanel **Cron** view, click *Run* on `sync-ads` once manually.
2. Open the task log — expect HTTP 200 and a JSON body like
   `{"message":"Sync completed", "results": {...}}`.
3. If you see HTTP 401, `CRON_SECRET` mismatches between cron env and app env.
4. If you see HTTP 500, check the Node app logs in aaPanel for the stack trace.

## Why no `vercel.json`

`vercel.json` is kept in the repo for historical reference but is ignored by
aaPanel. The 16 entries above are the source of truth for scheduling.
