import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { appConfig } from "../config.js";

const configCache = new Map();
const CONFIG_CACHE_LIMIT = 24;
const CONFIG_CACHE_TTL_MS = 10 * 60 * 1000;

mkdirSync(appConfig.dataDir, { recursive: true });
const dbPath = join(appConfig.dataDir, "ply.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
db.pragma("temp_store = MEMORY");
db.pragma("cache_size = -2000");
db.pragma("wal_autocheckpoint = 1000");

db.exec(`
  CREATE TABLE IF NOT EXISTS guilds (
    guild_id TEXT PRIMARY KEY,
    config BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL UNIQUE,
    type_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    claimed_by TEXT,
    answers_channel_id TEXT,
    pending_message_id TEXT,
    support_message_id TEXT,
    summary_message_id TEXT,
    current_question INTEGER NOT NULL DEFAULT 0,
    data BLOB,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_guild_status
    ON tickets (guild_id, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_owner_type
    ON tickets (guild_id, owner_id, type_id, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_answers
    ON tickets (answers_channel_id);

  CREATE TABLE IF NOT EXISTS guild_meta (
    guild_id TEXT PRIMARY KEY,
    panel_channel_id TEXT,
    panel_message_id TEXT,
    updated_at INTEGER NOT NULL
  );
`);

const statements = {
  getGuildConfig: db.prepare("SELECT config FROM guilds WHERE guild_id = ?"),
  saveGuildConfig: db.prepare(`
    INSERT INTO guilds (guild_id, config, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at
  `),
  createTicket: db.prepare(`
    INSERT INTO tickets (
      id, guild_id, channel_id, type_id, owner_id, mode, status,
      current_question, data, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  ticketById: db.prepare("SELECT * FROM tickets WHERE id = ?"),
  ticketByChannel: db.prepare("SELECT * FROM tickets WHERE channel_id = ?"),
  ticketByAnswersChannel: db.prepare(
    "SELECT * FROM tickets WHERE answers_channel_id = ?",
  ),
  openTicketForUser: db.prepare(`
    SELECT * FROM tickets
    WHERE guild_id = ? AND owner_id = ? AND type_id = ? AND status != 'closed'
    ORDER BY created_at DESC LIMIT 1
  `),
  activeChannelIds: db.prepare(
    "SELECT channel_id FROM tickets WHERE status != 'closed'",
  ),
  ticketsByStatus: db.prepare(
    "SELECT * FROM tickets WHERE status = ? ORDER BY created_at ASC",
  ),
  setStatus: db.prepare(
    "UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?",
  ),
  setData: db.prepare(
    "UPDATE tickets SET data = ?, updated_at = ? WHERE id = ?",
  ),
  setPending: db.prepare(`
    UPDATE tickets SET status = 'pending', pending_message_id = ?, data = ?, updated_at = ?
    WHERE id = ? AND status = 'open'
  `),
  setSupportMessage: db.prepare(
    "UPDATE tickets SET support_message_id = ?, updated_at = ? WHERE id = ?",
  ),
  setPendingMessage: db.prepare(
    "UPDATE tickets SET pending_message_id = ?, updated_at = ? WHERE id = ?",
  ),
  setSummaryMessage: db.prepare(
    "UPDATE tickets SET summary_message_id = ?, updated_at = ? WHERE id = ?",
  ),
  markSubmitted: db.prepare(`
    UPDATE tickets
    SET status = 'submitted', answers_channel_id = ?, summary_message_id = ?, updated_at = ?
    WHERE id = ?
  `),
  markAwaitingSubmit: db.prepare(`
    UPDATE tickets
    SET status = 'awaiting_submit', current_question = ?, data = ?, updated_at = ?
    WHERE id = ?
  `),
  beginSubmit: db.prepare(`
    UPDATE tickets SET status = 'submitting', updated_at = ?
    WHERE id = ? AND status = 'awaiting_submit'
  `),
  saveProgress: db.prepare(`
    UPDATE tickets
    SET status = ?, current_question = ?, data = ?, updated_at = ?
    WHERE id = ? AND status = 'saving'
  `),
  beginSaving: db.prepare(`
    UPDATE tickets SET status = 'saving', updated_at = ?
    WHERE id = ? AND status = 'answering'
  `),
  setAnswering: db.prepare(
    "UPDATE tickets SET status = 'answering', updated_at = ? WHERE id = ?",
  ),
  setClaimed: db.prepare(`
    UPDATE tickets
    SET status = 'claimed', claimed_by = ?, updated_at = ?
    WHERE id = ? AND claimed_by IS NULL AND status IN ('pending', 'submitted')
  `),
  closeTicket: db.prepare(
    "UPDATE tickets SET status = 'closed', updated_at = ? WHERE id = ?",
  ),
  clearAnswers: db.prepare(
    "UPDATE tickets SET answers_channel_id = NULL, updated_at = ? WHERE id = ?",
  ),
  getMeta: db.prepare(
    "SELECT panel_channel_id, panel_message_id FROM guild_meta WHERE guild_id = ?",
  ),
  setMeta: db.prepare(`
    INSERT INTO guild_meta (guild_id, panel_channel_id, panel_message_id, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      panel_channel_id = excluded.panel_channel_id,
      panel_message_id = excluded.panel_message_id,
      updated_at = excluded.updated_at
  `),
  clearMeta: db.prepare(
    "UPDATE guild_meta SET panel_message_id = NULL, updated_at = ? WHERE guild_id = ?",
  ),
};

function pack(value) {
  return gzipSync(Buffer.from(JSON.stringify(value ?? {}), "utf8"), {
    level: 9,
  });
}

function unpack(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(gunzipSync(value).toString("utf8"));
  } catch {
    return fallback;
  }
}

function rowToTicket(row) {
  if (!row) return null;
  return {
    ...row,
    data: unpack(row.data, { answers: [] }),
  };
}

function cacheConfig(guildId, config) {
  if (configCache.size >= CONFIG_CACHE_LIMIT) {
    const oldest = configCache.keys().next().value;
    if (oldest) configCache.delete(oldest);
  }
  configCache.set(guildId, {
    config,
    expires: Date.now() + CONFIG_CACHE_TTL_MS,
  });
}

export function getConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && cached.expires > Date.now()) {
    configCache.delete(guildId);
    configCache.set(guildId, cached);
    return cached.config;
  }
  if (cached) configCache.delete(guildId);

  const row = statements.getGuildConfig.get(guildId);
  if (!row?.config) return null;
  const config = unpack(row.config, null);
  if (!config) return null;
  cacheConfig(guildId, config);
  return config;
}

export function saveConfig(guildId, config) {
  const now = Date.now();
  statements.saveGuildConfig.run(guildId, pack(config), now, now);
  cacheConfig(guildId, config);
}

export function hasConfig(guildId) {
  return Boolean(statements.getGuildConfig.get(guildId));
}

export function newTicketId() {
  return randomBytes(6).toString("base64url");
}

export function createTicket({
  id,
  guildId,
  channelId,
  typeId,
  ownerId,
  mode,
  status,
  data = {},
}) {
  const now = Date.now();
  statements.createTicket.run(
    id,
    guildId,
    channelId,
    typeId,
    ownerId,
    mode,
    status,
    0,
    pack(data),
    now,
    now,
  );
  return getTicketById(id);
}

export function getTicketById(id) {
  return rowToTicket(statements.ticketById.get(id));
}

export function getTicketByChannel(channelId) {
  return rowToTicket(statements.ticketByChannel.get(channelId));
}

export function getTicketByAnswersChannel(channelId) {
  return rowToTicket(statements.ticketByAnswersChannel.get(channelId));
}

export function getOpenTicketForUser(guildId, ownerId, typeId) {
  return rowToTicket(
    statements.openTicketForUser.get(guildId, ownerId, typeId),
  );
}

export function getActiveTicketChannelIds() {
  return statements.activeChannelIds.all().map((row) => row.channel_id);
}

export function getTicketsByStatus(status) {
  return statements.ticketsByStatus.all(status).map(rowToTicket);
}

export function setTicketStatus(id, status) {
  return statements.setStatus.run(status, Date.now(), id).changes > 0;
}

export function setTicketData(id, data) {
  return (
    statements.setData.run(pack(data), Date.now(), id).changes > 0
  );
}

export function markTicketPending(id, pendingMessageId, data) {
  return (
    statements.setPending.run(
      pendingMessageId,
      pack(data),
      Date.now(),
      id,
    ).changes > 0
  );
}

export function setTicketSupportMessage(id, messageId) {
  return (
    statements.setSupportMessage.run(messageId, Date.now(), id).changes > 0
  );
}

export function setTicketPendingMessage(id, messageId) {
  return (
    statements.setPendingMessage.run(messageId, Date.now(), id).changes > 0
  );
}

export function setTicketSummaryMessage(id, messageId) {
  return (
    statements.setSummaryMessage.run(messageId, Date.now(), id).changes > 0
  );
}

export function markTicketSubmitted(id, answersChannelId, summaryMessageId) {
  return (
    statements.markSubmitted.run(
      answersChannelId,
      summaryMessageId,
      Date.now(),
      id,
    ).changes > 0
  );
}

export function markTicketAwaitingSubmit(id, currentQuestion, data) {
  return (
    statements.markAwaitingSubmit.run(
      currentQuestion,
      pack(data),
      Date.now(),
      id,
    ).changes > 0
  );
}

export function beginTicketSaving(id) {
  return statements.beginSaving.run(Date.now(), id).changes > 0;
}

export function beginTicketSubmit(id) {
  return statements.beginSubmit.run(Date.now(), id).changes > 0;
}

export function saveTicketProgress(id, status, currentQuestion, data) {
  return (
    statements.saveProgress.run(
      status,
      currentQuestion,
      pack(data),
      Date.now(),
      id,
    ).changes > 0
  );
}

export function markTicketAnswering(id) {
  return statements.setAnswering.run(Date.now(), id).changes > 0;
}

export function claimTicket(id, staffId) {
  return statements.setClaimed.run(staffId, Date.now(), id).changes > 0;
}

export function closeTicket(id) {
  return statements.closeTicket.run(Date.now(), id).changes > 0;
}

export function clearAnswersChannel(id) {
  return statements.clearAnswers.run(Date.now(), id).changes > 0;
}

export function getGuildMeta(guildId) {
  return statements.getMeta.get(guildId) || null;
}

export function setGuildPanel(guildId, channelId, messageId) {
  statements.setMeta.run(guildId, channelId, messageId, Date.now());
}

export function clearGuildPanelMessage(guildId) {
  statements.clearMeta.run(Date.now(), guildId);
}

export function clearConfigCache(guildId) {
  if (guildId) configCache.delete(guildId);
  else configCache.clear();
}

export function closeDatabase() {
  try {
    db.pragma("optimize");
  } catch {
    // Best effort only.
  }
  db.close();
}

export { dbPath };
