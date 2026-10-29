# Ply

**Just apply, but customized.**

Ply is a Discord ticket and application bot with animated flows, a fully graphical static dashboard, and a compact per-server config that fits in a Discord modal.

- **Classic tickets** — a welcome embed, a pendulum loading state after the first message, a staff notification with a claim button, then a claimed embed that turns into a spinner.
- **Question / application tickets** — a 5–10 second preparation animation, sequential questions, a 1–3 second saving animation after every answer, a green-check success embed, a review summary, and a private `answers-*` archive for admins.
- **Dashboard** — build every embed, image, GIF, color, timing, role and channel visually. It is a static site; it never needs a bot token.
- **Small configs** — the dashboard exports gzip-compressed JSON with short keys. An untouched config is **35 characters**; a typical configured server is a few hundred. The Discord modal limit is 4,000.
- **RAM conscious** — event-driven flows, no message collectors, minimal gateway intents, small caches, compressed SQLite rows, and a 24-entry config cache.

---

## Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [1. Create the Discord application](#1-create-the-discord-application)
- [2. Install](#2-install)
- [3. Configure the bot](#3-configure-the-bot)
- [4. Deploy commands and start](#4-deploy-commands-and-start)
- [5. Build your config in the dashboard](#5-build-your-config-in-the-dashboard)
- [6. Import and publish](#6-import-and-publish)
- [Commands](#commands)
- [Ticket flows](#ticket-flows)
- [How config codes work](#how-config-codes-work)
- [Dashboard](#dashboard)
- [Docker](#docker)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [Troubleshooting](#troubleshooting)
- [Privacy and safety](#privacy-and-safety)

---

## Architecture

```
ply/
├─ shared/     config schema, defaults, normalization, compact wire format, codecs
├─ bot/        discord.js client, SQLite store, commands and ticket flows
└─ dashboard/  React + Vite static configuration website
```

- **Runtime:** Node.js 22.12+.
- **Bot:** `discord.js` v14, `better-sqlite3`.
- **Dashboard:** React 19, Vite 8. Build output is plain static files.
- **Storage:** one SQLite file (`bot/data/ply.db` by default). Guild configs and ticket progress are stored as gzip-compressed JSON blobs. WAL mode, small page cache.
- **Media:** never uploaded or cached by Ply. Every animation is an external HTTPS URL loaded by Discord.

---

## Requirements

- Node.js **22.12 or newer** (npm 10+ recommended).
- A Discord application and bot token.
- The **Message Content** privileged intent enabled in the Developer Portal.
- A server where you can invite the bot with:

| Permission | Why |
| --- | --- |
| View Channels | See the panel and support channels |
| Send Messages | Post panels, embeds and notifications |
| Embed Links | Render embeds |
| Attach Files | Export codes as a `.txt` file when they are long |
| Read Message History | Fetch and edit its own messages |
| Manage Channels | Create and delete ticket / answers channels |
| Manage Roles | Apply channel permission overwrites |
| Use External Emojis | Custom emojis in panel buttons |

`Administrator` also works, but the list above is the minimum.

---

## 1. Create the Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. **Bot** → **Add Bot**. Copy the token.
3. **Bot** → **Privileged Gateway Intents** → enable **Message Content Intent**.
   - Ply does **not** need the Server Members or Presence intents.
4. **OAuth2** → **URL Generator** → scopes `bot` + `applications.commands`, select the permissions above, and invite the bot.
5. Copy the **Application ID** from **General Information**.

Ply stores everything per server. The same bot can serve many servers, each with its own imported config.

---

## 2. Install

```bash
npm install
```

This installs the bot, shared package and dashboard workspace.

---

## 3. Configure the bot

```bash
cp bot/.env.example bot/.env
```

Edit `bot/.env`:

```dotenv
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id

# Optional: deploy commands instantly to one test server
DISCORD_GUILD_ID=

# Optional: user IDs that can use owner-only commands anywhere
BOT_OWNER_IDS=
```

Notes:

- Commands are **owner-only**: the guild owner, or a user listed in `BOT_OWNER_IDS`.
- `DISCORD_GUILD_ID` is a development convenience. Leave it empty for global commands (they can take up to an hour to appear).
- `PLY_DATA_DIR` overrides the database location. On hosts with ephemeral disks, point it at a persistent volume.

---

## 4. Deploy commands and start

```bash
npm run deploy
npm start
```

Expected log:

```
Ply online as YourBot#1234 · 1 guild(s) · 0 open ticket(s)
```

For development:

```bash
npm run dev:bot
```

---

## 5. Build your config in the dashboard

```bash
npm run dev:dashboard
```

Open the printed local URL. The dashboard saves your work in `localStorage`; nothing is sent to a server.

Recommended order:

1. **Server** — in Discord run `/export_server`, copy the code, paste it into the dashboard. Every channel and role becomes a dropdown.
2. **Brand & panel** — set the panel channel, title, description, colors, images and component style.
3. **Ticket types** — add classic or question tickets, reorder them, set per-type categories, support channels and extra roles.
4. **Message studio** — edit every embed: title, description, image, thumbnail, footer, color. Placeholders such as `{user}` and `{ticket}` work everywhere.
5. **GIFs & media** — keep the defaults or replace them with direct Imgur / Tenor / Giphy URLs.
6. **Access & timing** — global admin/staff roles, one-open rules, delete-on-close, preview/save timings, button labels.
7. **Export & apply** — check readiness warnings, then copy the single config code.

The right-hand **live preview** shows the panel, classic flow, question flow and staff notification as you edit.

---

## 6. Import and publish

In Discord, as the server owner:

1. `/config_import`
2. Paste the `PLY1:...` code into the modal and submit.
3. Review warnings in the ephemeral reply.
4. Press **Publish panel** or run `/panel`.

Re-run `/panel` whenever you change the panel embed, ticket types or component style.

To continue editing a live server later, run `/config_export` and paste the returned code into **Export & apply → Import an existing config**.

---

## Commands

| Command | Who | Description |
| --- | --- | --- |
| `/config_import` | Server owner | Opens a modal for a `PLY1:` config code. |
| `/config_export` | Server owner | Exports this server's current config as a compact code (or `.txt` file). |
| `/export_server` | Server owner | Exports channel and role IDs as `PLYSRV1:` for the dashboard. |
| `/panel` | Server owner | Publishes or refreshes the ticket panel. |
| `/close` | Ticket participants | Closes the current ticket (with confirmation). |

`BOT_OWNER_IDS` users can run the owner commands in any server.

---

## Ticket flows

### Classic tickets

1. Member presses the panel button / picks the type.
2. Ply creates a private channel and sends the welcome embed.
3. The member's **first message** is captured as the request summary.
4. The welcome is followed by a pendulum embed ("waiting for staff").
5. A staff notification with a **Claim** button appears in the support channel.
6. A staff member claims it. The ticket channel becomes visible to the claimer.
7. The claimed embed is posted in the ticket, then replaced by a spinner embed after the configured delay.
8. Anyone allowed can close the ticket; optionally the channel is deleted after a delay.

### Question / application tickets

1. Member picks the type.
2. Channel is created with **owner + admin roles** visibility only. Staff do not see it yet.
3. A preparing animation plays for a random 5–10 seconds.
4. Questions are asked one at a time. Each answer gets a saving animation (1–3 seconds) and a green-check success embed.
5. After the last answer, a summary embed with a **Send answers** button appears. Only the owner can submit.
6. On submit, Ply creates `answers-<ticket>` with the same summary. That channel is visible **only to admins, the guild owner and Ply**.
7. The original summary becomes a submitted embed and the staff notification gets a claim button.
8. Claiming grants the claimer access and switches the notification to the claimed state.

Optional questions accept the configured skip word (`skip` by default). Required questions reject it.

### Visibility summary

| Channel | Visible to |
| --- | --- |
| Classic ticket | Owner, staff roles, admin roles, guild owner, Ply |
| Question ticket (before claim) | Owner, admin roles, guild owner, Ply |
| Question ticket (after claim) | Owner, admin roles, guild owner, claimer, Ply |
| `answers-*` archive | Admin roles, guild owner, Ply |

---

## How config codes work

The dashboard and bot share the same codec.

1. The config is normalized and compared to defaults.
2. Only changed values are written, with short keys (`i`, `p`, `t`, `y`, …).
3. The JSON is gzip-compressed and base64url-encoded.
4. The result is prefixed with `PLY1:`.

```text
PLY1:H4sIAAAAAAAAA6uuBQBDv6ajAgAAAA
```

- Default config: **35 characters**.
- Configured example: **~175 characters**.
- Discord modal limit: **4,000 characters**.
- The dashboard shows the live size and blocks copying above the limit.

The bot also accepts:

- Fenced code blocks (triple backticks).
- Raw wire JSON.
- Full pretty-printed JSON exports.

`PLYSRV1:` server exports use the same container but a different schema.

### Where the size goes

The biggest contributors are long embed descriptions, image URLs, question lists and per-type overrides. Reuse global messages where possible; per-type message overrides are only stored when they differ.

---

## Dashboard

```bash
npm run dev:dashboard     # local development
npm run build             # static build in dashboard/dist
npm run preview           # preview the production build
```

Deploy `dashboard/dist` to any static host (GitHub Pages, Netlify, Cloudflare Pages, S3, nginx). `base` is `./`, so it works from a subpath without changes.

The dashboard:

- stores config and the server snapshot in `localStorage`,
- requires no backend, token or login,
- validates channel/role IDs against the imported server snapshot,
- exports the compact code, a `.txt` file, or a full JSON backup,
- imports an existing `PLY1:` code from `/config_export`.

### Default animations

| State | Default URL |
| --- | --- |
| Pendulum | `https://media.tenor.com/ZDQm6tcyVooAAAAM/pendulum.gif` |
| Spinner | `https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif` |
| Preparing | `https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif` |
| Saving | `https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif` |
| Success | `https://media.giphy.com/media/bpv34afu6bbcFFIXtX/giphy.gif` |

Use direct media URLs. Ply only accepts `http(s)` URLs and never mirrors the files.

---

## Docker

Build and run the bot:

```bash
docker build -t ply .
docker run -d --name ply \
  --env-file bot/.env \
  -v ply-data:/data \
  -e PLY_DATA_DIR=/data \
  --restart unless-stopped \
  ply
```

Deploy commands once with the same environment:

```bash
docker run --rm --env-file bot/.env -v ply-data:/data -e PLY_DATA_DIR=/data ply npm run deploy
```

The image contains the bot and shared package only; the dashboard is a separate static build.

---

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DISCORD_TOKEN` | — | **Required.** Bot token. |
| `CLIENT_ID` | — | **Required for `/deploy`.** Application ID. |
| `DISCORD_GUILD_ID` | empty | Deploy commands to one guild for instant updates. |
| `BOT_OWNER_IDS` | empty | Comma-separated user IDs with owner-command access. |
| `BOT_PRESENCE` | `Just apply, but customized.` | Bot "Watching" status. |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info` or `debug`. |
| `PLY_DATA_DIR` | `bot/data` | Directory for `ply.db`. |
| `REST_TIMEOUT_MS` | `20000` | Discord REST timeout. |
| `REST_RETRIES` | `2` | Discord REST retries. |

---

## Project layout

```
shared/src/
  defaults.js       default config, embeds, labels, ticket types
  normalize.js      validation, clamping, effective overrides
  wire.js           short-key compact format
  codec.js          gzip + base64url PLY1 / PLYSRV1
  index.js          public exports and placeholders

bot/src/
  index.js          client, cache limits, lifecycle
  deploy-commands.js
  commands/         slash command definitions
  events/           messageCreate, channelDelete, ready
  features/
    createTicket.js channel creation and access
    classic.js      first-message and pendulum flow
    questions.js    question, saving, summary, submit, recovery
    claim.js        staff claim and claimed → spinner
    close.js        confirmation and close
    support.js      staff notification
    panel.js        panel publishing
    config.js       import / export / server export
    interactions.js custom-ID router
  lib/              SQLite, embeds, permissions, placeholders, components

dashboard/src/
  App.jsx           shell, state, navigation, export encoding
  sections/         brand, types, messages, media, access, server, export
  components/       UI primitives and Discord preview
  lib/              storage, path updates, server lookups, validation
  styles.css

shared/test/        codec, wire, normalization and size tests
```

---

## Troubleshooting

**Commands do not appear.**
Run `npm run deploy`. Global commands can take up to an hour; set `DISCORD_GUILD_ID` for instant guild commands.

**“This ticket type has no valid support channel configured.”**
Set a support channel globally or per ticket type. `/export_server` makes this a dropdown in the dashboard.

**“The configured ticket category is missing.”**
Category IDs are checked when a ticket opens. Re-import the server snapshot and pick a category that still exists.

**Question tickets are invisible to staff.**
That is intentional before a claim. Staff receive the notification in the support channel once the application is submitted. Admins can see the ticket channel from the start.

**The panel has a dropdown instead of a button.**
Panel style `auto` uses a button for exactly one enabled type and a dropdown for several. You can force `Buttons` (up to five types) or `Dropdown` in **Brand & panel**.

**`/config_import` says the config is too large.**
Discord modals cap at 4,000 characters. Remove unused ticket types, shorten long descriptions, or delete per-type overrides and image URLs you no longer need.

**Answers channel is not created.**
The bot needs Manage Channels and Manage Roles, and the category must accept channel creation. Check the ephemeral error and bot logs.

**Media does not render.**
Use a direct `https://` link to a GIF/PNG. Discord cannot render HTML pages or some CDN preview links.

**Bot restarted mid-application.**
On startup Ply resumes preparing tickets, resumes saving state from the persisted answer index, re-sends a missing summary, and releases stuck submissions. No message collectors are used.

---

## Privacy and safety

- Configs and ticket progress stay in your SQLite database.
- The dashboard stores config in your browser's `localStorage` only.
- No analytics, telemetry or external API calls except Discord and the media URLs you choose.
- Owner commands are restricted to the guild owner and explicit `BOT_OWNER_IDS`.
- Answers archives are permission-locked to admins, the guild owner and the bot.

---

**Ply — Just apply, but customized.**
